package com.example.recommendationservice.service;

import com.example.recommendationservice.dto.TmdbMovie;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
@Slf4j
public class TmdbService {

    @Value("${tmdb.api.base-url}")
    private String tmdbBaseUrl;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    @Value("${tmdb.api.key}")
    private String tmdbApiKey;

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;

    @Getter
    private final Map<Integer, String> genreMap = new HashMap<>();

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA");
    }

    public List<TmdbMovie> getRecommendations(List<String> favoriteGenres,
                                              List<String> favoriteActors,
                                              List<String> favoriteMovies,
                                              List<String> favoriteDirectors,
                                              Double minRating) {
        try {
            Set<TmdbMovie> recommendations = new HashSet<>();
            Random random = new Random();

            // Рекомендации по похожим фильмам (2 страницы)
            for (String movieId : favoriteMovies) {
                recommendations.addAll(getSimilarMovies(movieId, 2));
            }

            // Рекомендации по актерам (2 страницы)
            for (String actorId : favoriteActors) {
                recommendations.addAll(getMoviesByPerson(actorId, "cast"));
            }

            // Рекомендации по режиссерам (2 страницы)
            for (String directorId : favoriteDirectors) {
                recommendations.addAll(getMoviesByPerson(directorId, "crew"));
            }

            // Рекомендации по жанрам с случайной сортировкой (2 страницы)
            String[] sortOptions = {"popularity.desc", "vote_average.desc", "release_date.desc"};
            String sortBy = sortOptions[random.nextInt(sortOptions.length)];
            recommendations.addAll(discoverMovies(favoriteGenres, minRating, sortBy, 2));

            // Фильтруем и случайно выбираем 20 фильмов
            List<TmdbMovie> filteredMovies = new ArrayList<>( // Преобразуем в изменяемый список
                    recommendations.stream()
                            .filter(movie -> movie.getVoteAverage() >= minRating)
                            .sorted(Comparator.comparing(TmdbMovie::getVoteAverage).reversed())
                            .toList()
            );

            // Случайный выбор 20 фильмов (или меньше, если фильмов недостаточно)
            Collections.shuffle(filteredMovies, random);
            return filteredMovies.stream()
                    .limit(20)
                    .toList();

        } catch (Exception e) {
            log.error("Error getting recommendations from TMDB", e);
            return Collections.emptyList();
        }
    }

    private List<TmdbMovie> getSimilarMovies(String movieId, int pages) {
        List<TmdbMovie> movies = new ArrayList<>();
        for (int page = 1; page <= pages; page++) {
            String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}/similar")
                    .queryParam("page", page)
                    .buildAndExpand(movieId)
                    .toUriString();
            movies.addAll(fetchMovies(url));
        }
        return movies;
    }

    private List<TmdbMovie> getMoviesByPerson(String personId, String creditType) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{personId}/movie_credits")
                .buildAndExpand(personId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> credits = (List<Map<String, Object>>) response.getBody().get(creditType);
            return credits.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> discoverMovies(List<String> genres, Double minRating, String sortBy, int pages) {
        List<TmdbMovie> movies = new ArrayList<>();
        String genreQuery = String.join(",", genres.stream().map(String::valueOf).toList());

        for (int page = 1; page <= pages; page++) {
            String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/discover/movie")
                    .queryParam("with_genres", genreQuery)
                    .queryParam("vote_average.gte", minRating)
                    .queryParam("sort_by", sortBy)
                    .queryParam("page", page)
                    .build()
                    .toUriString();
            movies.addAll(fetchMovies(url));
        }
        return movies;
    }

    private List<TmdbMovie> fetchMovies(String url) {
        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
            return results.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private TmdbMovie mapToTmdbMovie(Map<String, Object> movieMap) {
        loadGenresIfNeeded();
        TmdbMovie movie = new TmdbMovie();
        movie.setId((Integer) movieMap.get("id"));
        movie.setTitle((String) movieMap.get("title"));
        movie.setOverview((String) movieMap.get("overview"));
        movie.setPosterPath((String) movieMap.get("poster_path"));
        movie.setVoteAverage(
                movieMap.get("vote_average") instanceof Number ?
                        ((Number) movieMap.get("vote_average")).doubleValue() : 0.0);
        if (movieMap.get("genre_ids") instanceof List<?>) {
            List<Integer> ids = (List<Integer>) movieMap.get("genre_ids");
            movie.setGenreIds(ids);
            List<String> names = ids.stream()
                    .map(genreMap::get)
                    .filter(Objects::nonNull)
                    .toList();
            movie.setGenreNames(names);
        }
        return movie;
    }

    void loadGenresIfNeeded() {
        if (!genreMap.isEmpty()) return;
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/genre/movie/list")
                .toUriString();
        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> genres = (List<Map<String, Object>>) response.getBody().get("genres");
            for (Map<String, Object> genre : genres) {
                genreMap.put((Integer) genre.get("id"), (String) genre.get("name"));
            }
        }
    }

    public String getFullPosterUrl(String posterPath) {
        return posterPath != null ? imageBaseUrl + posterPath : null;
    }
}