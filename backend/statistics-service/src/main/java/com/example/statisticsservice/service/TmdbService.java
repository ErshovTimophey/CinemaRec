package com.example.statisticsservice.service;

import com.example.statisticsservice.dto.MovieDetails;
import com.example.statisticsservice.dto.TmdbMovie;
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

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;

    private final Map<Integer, String> genreMap = new HashMap<>();

    private static final int MIN_VOTE_COUNT = 100;
    private static final double MIN_POPULARITY = 10.0;
    private static final String EXCLUDE_COUNTRY = "IN";

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA");
    }

    public List<TmdbMovie> searchMovies(String query, int page) {
        try {
            String endpoint = query.isEmpty() ? "/movie/popular" : "/search/movie";
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path(endpoint)
                    .queryParam("vote_count.gte", MIN_VOTE_COUNT)
                    .queryParam("popularity.gte", MIN_POPULARITY)
                    .queryParam("without_countries", EXCLUDE_COUNTRY)
                    .queryParam("page", page);

            if (!query.isEmpty()) {
                builder.queryParam("query", query);
            } else {
                builder.queryParam("sort_by", "popularity.desc");
            }

            String url = builder.build().toUriString();

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
                return results.stream()
                        .map(this::mapToTmdbMovie)
                        .collect(Collectors.toList());
            }
            log.warn("No movies found for query: {}, page: {}", query, page);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error searching movies for query: {}, page: {}", query, page, e);
            return Collections.emptyList();
        }
    }

    public MovieDetails getMovieDetails(Integer movieId) {
        // ... (unchanged, kept for completeness)
        try {
            String movieUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}")
                    .buildAndExpand(movieId)
                    .toUriString();
            ResponseEntity<Map> movieResponse = restTemplate.exchange(
                    movieUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

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
                if (movieData.get("production_countries") instanceof List<?>) {
                    List<Map<String, Object>> countries = (List<Map<String, Object>>) movieData.get("production_countries");
                    if (!countries.isEmpty()) {
                        details.setCountry((String) countries.get(0).get("name"));
                    }
                }
            }

            if (creditsResponse.getStatusCode() == HttpStatus.OK && creditsResponse.getBody() != null) {
                Map<String, Object> creditsData = creditsResponse.getBody();
                if (creditsData.get("cast") instanceof List<?>) {
                    List<Map<String, Object>> cast = (List<Map<String, Object>>) creditsData.get("cast");
                    details.setActors(cast.stream()
                            .map(actor -> (String) actor.get("name"))
                            .limit(5)
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

            log.info("Fetched details for movieId: {}", movieId);
            return details;

        } catch (Exception e) {
            log.error("Error fetching movie details for movieId: {}", movieId, e);
            return new MovieDetails();
        }
    }

    private TmdbMovie mapToTmdbMovie(Map<String, Object> movieMap) {
        // ... (unchanged)
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

    void loadGenresIfNeeded() {
        // ... (unchanged)
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
        // ... (unchanged)
        return posterPath != null ? imageBaseUrl + posterPath : null;
    }
}