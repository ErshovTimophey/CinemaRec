package com.example.recommendationservice.service;

import com.example.recommendationservice.dto.TmdbMovie;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.stream.Collectors;

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

    // Минимальные пороги для фильтрации
    private static final int MIN_VOTE_COUNT = 100;
    private static final double MIN_POPULARITY = 10.0;
    private static final String EXCLUDE_COUNTRY = "IN"; // Исключаем Индию

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA");
    }

    public RecommendationsByCategory getRecommendations(List<String> favoriteGenres,
                                                        List<String> favoriteActors,
                                                        List<String> favoriteMovies,
                                                        List<String> favoriteDirectors,
                                                        Double minRating) {
        try {
            Random random = new Random();
            RecommendationsByCategory result = new RecommendationsByCategory();
            // Множество для отслеживания использованных фильмов (по id) между категориями
            Set<Integer> usedMovieIds = new HashSet<>();

            // Рекомендации по похожим фильмам (5 страниц)
            List<TmdbMovie> movieRecommendations = new ArrayList<>();
            for (String movieId : favoriteMovies) {
                movieRecommendations.addAll(getSimilarMovies(movieId, 5));
            }
            result.setMovieRecommendations(filterAndLimit(movieRecommendations, minRating, random, 20, usedMovieIds));
            log.debug("Movie recommendations: {} films, unique IDs added: {}",
                    result.getMovieRecommendations().size(), usedMovieIds.size());

            // Рекомендации по актерам (5 страниц)
            List<TmdbMovie> actorRecommendations = new ArrayList<>();
            for (String actorId : favoriteActors) {
                actorRecommendations.addAll(getMoviesByPerson(actorId, "cast"));
            }
            result.setActorRecommendations(filterAndLimit(actorRecommendations, minRating, random, 20, usedMovieIds));
            log.debug("Actor recommendations: {} films, unique IDs added: {}",
                    result.getActorRecommendations().size(), usedMovieIds.size());

            // Рекомендации по режиссерам (5 страниц)
            List<TmdbMovie> directorRecommendations = new ArrayList<>();
            for (String directorId : favoriteDirectors) {
                directorRecommendations.addAll(getMoviesByPerson(directorId, "crew"));
            }
            result.setDirectorRecommendations(filterAndLimit(directorRecommendations, minRating, random, 20, usedMovieIds));
            log.debug("Director recommendations: {} films, unique IDs added: {}",
                    result.getDirectorRecommendations().size(), usedMovieIds.size());

            // Рекомендации по жанрам (5 страниц)
            String[] sortOptions = {"popularity.desc", "vote_average.desc", "release_date.desc"};
            String sortBy = sortOptions[random.nextInt(sortOptions.length)];
            List<TmdbMovie> genreRecommendations = discoverMovies(favoriteGenres, minRating, sortBy, 5);
            result.setGenreRecommendations(filterAndLimit(genreRecommendations, minRating, random, 20, usedMovieIds));
            log.debug("Genre recommendations: {} films, unique IDs added: {}",
                    result.getGenreRecommendations().size(), usedMovieIds.size());

            return result;

        } catch (Exception e) {
            log.error("Error getting recommendations from TMDB", e);
            return new RecommendationsByCategory();
        }
    }

    private List<TmdbMovie> filterAndLimit(List<TmdbMovie> movies, Double minRating, Random random, int limit, Set<Integer> usedMovieIds) {
        // Дедупликация внутри входного списка фильмов
        Map<Integer, TmdbMovie> uniqueMovies = new LinkedHashMap<>();
        for (TmdbMovie movie : movies) {
            if (!uniqueMovies.containsKey(movie.getId())) {
                uniqueMovies.put(movie.getId(), movie);
            }
        }
        List<TmdbMovie> deduplicatedMovies = new ArrayList<>(uniqueMovies.values());
        log.debug("Deduplicated input list: {} movies reduced to {} unique movies", movies.size(), deduplicatedMovies.size());

        List<TmdbMovie> filteredMovies = new ArrayList<>(
                deduplicatedMovies.stream()
                        .filter(movie -> movie.getVoteAverage() >= minRating)
                        .filter(movie -> movie.getVoteCount() != null && movie.getVoteCount() >= MIN_VOTE_COUNT)
                        .filter(movie -> movie.getPopularity() != null && movie.getPopularity() >= MIN_POPULARITY)
                        .filter(movie -> movie.getProductionCountries() != null && !movie.getProductionCountries().contains(EXCLUDE_COUNTRY))
                        // Исключаем фильмы, уже использованные в других категориях
                        .filter(movie -> !usedMovieIds.contains(movie.getId()))
                        .sorted(Comparator.comparing(TmdbMovie::getVoteAverage).reversed())
                        .toList()
        );

        if (filteredMovies.isEmpty()) {
            log.warn("No movies found after filtering with minRating={}, minVoteCount={}, minPopularity={}, excludeCountry={}, usedMovieIds={}",
                    minRating, MIN_VOTE_COUNT, MIN_POPULARITY, EXCLUDE_COUNTRY, usedMovieIds.size());
            return Collections.emptyList();
        }

        Collections.shuffle(filteredMovies, random);
        List<TmdbMovie> selectedMovies = filteredMovies.stream()
                .limit(limit)
                .toList();

        // Добавляем ID выбранных фильмов в usedMovieIds
        selectedMovies.forEach(movie -> usedMovieIds.add(movie.getId()));
        log.debug("Filtered and selected {} movies, new usedMovieIds size: {}", selectedMovies.size(), usedMovieIds.size());

        return selectedMovies;
    }

    private List<TmdbMovie> getSimilarMovies(String movieId, int pages) {
        // Множество для отслеживания уникальных фильмов внутри метода
        Set<Integer> seenMovieIds = new HashSet<>();
        List<TmdbMovie> movies = new ArrayList<>();
        for (int page = 1; page <= pages; page++) {
            String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}/similar")
                    .queryParam("page", page)
                    .queryParam("vote_count.gte", MIN_VOTE_COUNT)
                    .queryParam("without_countries", EXCLUDE_COUNTRY)
                    .buildAndExpand(movieId)
                    .toUriString();
            List<TmdbMovie> pageMovies = fetchMovies(url);
            for (TmdbMovie movie : pageMovies) {
                if (!seenMovieIds.contains(movie.getId())) {
                    movies.add(movie);
                    seenMovieIds.add(movie.getId());
                }
            }
        }
        log.debug("getSimilarMovies for movieId={} returned {} unique movies from {} total", movieId, movies.size(), seenMovieIds.size());
        return movies;
    }

    private List<TmdbMovie> getMoviesByPerson(String personId, String creditType) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{personId}/movie_credits")
                .queryParam("vote_count.gte", MIN_VOTE_COUNT)
                .buildAndExpand(personId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> credits = (List<Map<String, Object>>) response.getBody().get(creditType);
            // Множество для отслеживания уникальных фильмов
            Set<Integer> seenMovieIds = new HashSet<>();
            List<TmdbMovie> movies = new ArrayList<>();
            for (Map<String, Object> credit : credits) {
                TmdbMovie movie = mapToTmdbMovie(credit);
                if (movie.getProductionCountries() != null
                        && !movie.getProductionCountries().contains(EXCLUDE_COUNTRY)
                        && !seenMovieIds.contains(movie.getId())) {
                    movies.add(movie);
                    seenMovieIds.add(movie.getId());
                }
            }
            log.debug("getMoviesByPerson for personId={} (type={}) returned {} unique movies", personId, creditType, movies.size());
            return movies;
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> discoverMovies(List<String> genres, Double minRating, String sortBy, int pages) {
        // Множество для отслеживания уникальных фильмов
        Set<Integer> seenMovieIds = new HashSet<>();
        List<TmdbMovie> movies = new ArrayList<>();
        String genreQuery = String.join(",", genres.stream().map(String::valueOf).toList());

        for (int page = 1; page <= pages; page++) {
            String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/discover/movie")
                    .queryParam("with_genres", genreQuery)
                    .queryParam("vote_average.gte", minRating)
                    .queryParam("vote_count.gte", MIN_VOTE_COUNT)
                    .queryParam("popularity.gte", MIN_POPULARITY)
                    .queryParam("without_countries", EXCLUDE_COUNTRY)
                    .queryParam("sort_by", sortBy)
                    .queryParam("page", page)
                    .build()
                    .toUriString();
            List<TmdbMovie> pageMovies = fetchMovies(url);
            for (TmdbMovie movie : pageMovies) {
                if (!seenMovieIds.contains(movie.getId())) {
                    movies.add(movie);
                    seenMovieIds.add(movie.getId());
                }
            }
        }
        log.debug("discoverMovies for genres={} returned {} unique movies", genreQuery, movies.size());
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
        movie.setVoteCount(
                movieMap.get("vote_count") instanceof Number ?
                        ((Number) movieMap.get("vote_count")).intValue() : 0);
        movie.setPopularity(
                movieMap.get("popularity") instanceof Number ?
                        ((Number) movieMap.get("popularity")).doubleValue() : 0.0);
        if (movieMap.get("genre_ids") instanceof List<?>) {
            List<Integer> ids = (List<Integer>) movieMap.get("genre_ids");
            movie.setGenreIds(ids);
            List<String> names = ids.stream()
                    .map(genreMap::get)
                    .filter(Objects::nonNull)
                    .toList();
            movie.setGenreNames(names);
        }
        if (movieMap.get("production_countries") instanceof List<?>) {
            List<Map<String, Object>> countries = (List<Map<String, Object>>) movieMap.get("production_countries");
            List<String> countryCodes = countries.stream()
                    .map(country -> (String) country.get("iso_3166_1"))
                    .filter(Objects::nonNull)
                    .toList();
            movie.setProductionCountries(countryCodes);
        }
        return movie;
    }

    public MovieDetails getMovieDetails(Integer movieId) {
        try {
            // Получение основной информации о фильме
            String movieUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}")
                    .buildAndExpand(movieId)
                    .toUriString();
            ResponseEntity<Map> movieResponse = restTemplate.exchange(
                    movieUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            // Получение актёров и режиссёров
            String creditsUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}/credits")
                    .buildAndExpand(movieId)
                    .toUriString();
            ResponseEntity<Map> creditsResponse = restTemplate.exchange(
                    creditsUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            MovieDetails details = new MovieDetails();

            if (movieResponse.getStatusCode() == HttpStatus.OK && movieResponse.getBody() != null) {
                Map<String, Object> movieData = movieResponse.getBody();
                details.setId((Integer) movieData.get("id"));
                details.setTitle((String) movieData.get("title"));
                details.setOverview((String) movieData.get("overview"));
                details.setPosterPath((String) movieData.get("poster_path"));
                details.setVoteAverage(
                        movieData.get("vote_average") instanceof Number ?
                                ((Number) movieData.get("vote_average")).doubleValue() : 0.0);
                details.setReleaseDate((String) movieData.get("release_date"));
                details.setRuntime(
                        movieData.get("runtime") instanceof Number ?
                                ((Number) movieData.get("runtime")).intValue() : 0);
                if (movieData.get("genres") instanceof List<?>) {
                    List<Map<String, Object>> genres = (List<Map<String, Object>>) movieData.get("genres");
                    details.setGenres(genres.stream()
                            .map(genre -> (String) genre.get("name"))
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList()));
                }
            }

            if (creditsResponse.getStatusCode() == HttpStatus.OK && creditsResponse.getBody() != null) {
                Map<String, Object> creditsData = creditsResponse.getBody();
                if (creditsData.get("cast") instanceof List<?>) {
                    List<Map<String, Object>> cast = (List<Map<String, Object>>) creditsData.get("cast");
                    details.setActors(cast.stream()
                            .map(actor -> (String) actor.get("name"))
                            .limit(5) // Ограничим до 5 актёров
                            .collect(Collectors.toList()));
                }
                if (creditsData.get("crew") instanceof List<?>) {
                    List<Map<String, Object>> crew = (List<Map<String, Object>>) creditsData.get("crew");
                    details.setDirectors(crew.stream()
                            .filter(member -> "Director".equals(member.get("job")))
                            .map(member -> (String) member.get("name"))
                            .collect(Collectors.toList()));
                }
            }

            return details;

        } catch (Exception e) {
            log.error("Error fetching movie details for movieId={}", movieId, e);
            return new MovieDetails();
        }
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

    @Data
    public static class RecommendationsByCategory {
        private List<TmdbMovie> actorRecommendations = new ArrayList<>();
        private List<TmdbMovie> genreRecommendations = new ArrayList<>();
        private List<TmdbMovie> directorRecommendations = new ArrayList<>();
        private List<TmdbMovie> movieRecommendations = new ArrayList<>();
    }

    @Data
    public static class MovieDetails {
        private Integer id;
        private String title;
        private String overview;
        private String posterPath;
        private Double voteAverage;
        private String releaseDate;
        private Integer runtime;
        private List<String> genres = new ArrayList<>();
        private List<String> actors = new ArrayList<>();
        private List<String> directors = new ArrayList<>();
    }
}