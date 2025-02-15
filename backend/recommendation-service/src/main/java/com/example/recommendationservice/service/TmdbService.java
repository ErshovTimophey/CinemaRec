package com.example.recommendationservice.service;

import com.example.recommendationservice.dto.TmdbMovie;
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

    @Value("${tmdb.api.key}")
    private String tmdbApiKey;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    private final RestTemplate restTemplate;

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<TmdbMovie> getRecommendations(List<Integer> favoriteGenres,
                                              List<Integer> favoriteActors,
                                              List<Integer> favoriteMovies,
                                              Double minRating) {
        try {
            // 1. Get similar movies based on favorite movies
            Set<TmdbMovie> recommendations = new HashSet<>();

            for (Integer movieId : favoriteMovies) {
                List<TmdbMovie> similarMovies = getSimilarMovies(movieId);
                recommendations.addAll(similarMovies);
            }

            // 2. Get movies by favorite actors
            for (Integer actorId : favoriteActors) {
                List<TmdbMovie> actorMovies = getMoviesByActor(actorId);
                recommendations.addAll(actorMovies);
            }

            // 3. Get movies by genres
            List<TmdbMovie> genreMovies = discoverMovies(favoriteGenres, minRating);
            recommendations.addAll(genreMovies);

            // Filter and sort
            return recommendations.stream()
                    .filter(movie -> movie.getVoteAverage() >= minRating)
                    .sorted(Comparator.comparing(TmdbMovie::getVoteAverage).reversed())
                    .limit(20)
                    .toList();

        } catch (Exception e) {
            log.error("Error getting recommendations from TMDB", e);
            return Collections.emptyList();
        }
    }

    private List<TmdbMovie> getSimilarMovies(Integer movieId) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/movie/{movieId}/similar")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(movieId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
            return results.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> getMoviesByActor(Integer actorId) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{actorId}/movie_credits")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(actorId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> cast = (List<Map<String, Object>>) response.getBody().get("cast");
            return cast.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> discoverMovies(List<Integer> genres, Double minRating) {
        String genreQuery = genres.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse("");

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/discover/movie")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("with_genres", genreQuery)
                .queryParam("vote_average.gte", minRating)
                .queryParam("sort_by", "vote_average.desc")
                .build()
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
            return results.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private TmdbMovie mapToTmdbMovie(Map<String, Object> movieMap) {
        TmdbMovie movie = new TmdbMovie();
        movie.setId((Integer) movieMap.get("id"));
        movie.setTitle((String) movieMap.get("title"));
        movie.setOverview((String) movieMap.get("overview"));
        movie.setPosterPath((String) movieMap.get("poster_path"));
        movie.setVoteAverage((Double) movieMap.get("vote_average"));

        if (movieMap.get("genre_ids") != null) {
            movie.setGenreIds((List<Integer>) movieMap.get("genre_ids"));
        }

        return movie;
    }

    public String getFullPosterUrl(String posterPath) {
        return posterPath != null ? imageBaseUrl + posterPath : null;
    }
}