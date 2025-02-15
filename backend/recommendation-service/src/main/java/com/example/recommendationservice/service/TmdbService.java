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

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    @Value("${tmdb.api.key}")
    private String tmdbApiKey;

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;

        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", tmdbApiKey);
    }

    public List<TmdbMovie> getRecommendations(List<String> favoriteGenres,
                                              List<String> favoriteActors,
                                              List<String> favoriteMovies,
                                              Double minRating) {
        try {
            Set<TmdbMovie> recommendations = new HashSet<>();

            for (String movieId : favoriteMovies) {
                recommendations.addAll(getSimilarMovies(movieId));
            }

            for (String actorId : favoriteActors) {
                recommendations.addAll(getMoviesByActor(actorId));
            }

            recommendations.addAll(discoverMovies(favoriteGenres, minRating));

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

    private List<TmdbMovie> getSimilarMovies(String movieId) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/movie/{movieId}/similar")
                .buildAndExpand(movieId)
                .toUriString();

        return fetchMovies(url);
    }

    private List<TmdbMovie> getMoviesByActor(String actorId) {
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{actorId}/movie_credits")
                .buildAndExpand(actorId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> cast = (List<Map<String, Object>>) response.getBody().get("cast");
            return cast.stream()
                    .map(this::mapToTmdbMovie)
                    .toList();
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> discoverMovies(List<String> genres, Double minRating) {
        String genreQuery = String.join(",", genres.stream().map(String::valueOf).toList());

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/discover/movie")
                .queryParam("with_genres", genreQuery)
                .queryParam("vote_average.gte", minRating)
                .queryParam("sort_by", "vote_average.desc")
                .build()
                .toUriString();

        return fetchMovies(url);
    }

    private List<TmdbMovie> fetchMovies(String url) {
        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

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
        movie.setVoteAverage(
                movieMap.get("vote_average") instanceof Number ?
                        ((Number) movieMap.get("vote_average")).doubleValue() :
                        0.0
        );

        if (movieMap.get("genre_ids") instanceof List<?>) {
            movie.setGenreIds((List<Integer>) movieMap.get("genre_ids"));
        }

        return movie;
    }

    public String getFullPosterUrl(String posterPath) {
        return posterPath != null ? imageBaseUrl + posterPath : null;
    }
}
