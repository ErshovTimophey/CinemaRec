package com.example.recommendationservice.service;

import com.example.recommendationservice.dto.AdminTmdbSearchMovie;
import com.example.recommendationservice.model.AdminMovie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TmdbAdminService {

    private final RestTemplate restTemplate;

    // Reuse the same base URL and image base URL style as other TMDB services.
    private final String tmdbBaseUrl = "https://api.themoviedb.org/3";
    private final String imageBaseUrl = "https://image.tmdb.org/t/p/w500";

    // Use the same bearer token style as in existing TmdbService (already working in this service).
    private final String bearerToken = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA";

    private HttpHeaders headers;

    @jakarta.annotation.PostConstruct
    void init() {
        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", bearerToken);
    }

    /**
     * Find best matching TMDB movie for a given title and map basic fields into an AdminMovie template.
     */
    public Optional<AdminMovie> buildFromTitle(String title) {
        try {
            String searchUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/search/movie")
                    .queryParam("query", title)
                    .toUriString();

            ResponseEntity<Map> searchResponse = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (!searchResponse.getStatusCode().is2xxSuccessful() || searchResponse.getBody() == null) {
                log.warn("TMDB search returned non-success status for title={}", title);
                return Optional.empty();
            }

            Object resultsObj = searchResponse.getBody().get("results");
            if (!(resultsObj instanceof List<?> results) || results.isEmpty()) {
                log.info("No TMDB search results for title={}", title);
                return Optional.empty();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> first = (Map<String, Object>) results.get(0);
            Integer tmdbId = first.get("id") instanceof Number
                    ? ((Number) first.get("id")).intValue()
                    : null;

            if (tmdbId == null) {
                log.warn("TMDB search result for title={} has no id", title);
                return Optional.empty();
            }

            return buildFromId(tmdbId)
                    .map(movie -> {
                        if (movie.getTitle() == null) {
                            movie.setTitle((String) first.getOrDefault("title", title));
                        }
                        return movie;
                    });
        } catch (Exception e) {
            log.error("Error fetching TMDB data for title={}", title, e);
            return Optional.empty();
        }
    }

    /**
     * Build AdminMovie from a concrete TMDB movie id.
     */
    public Optional<AdminMovie> buildFromId(Integer tmdbId) {
        if (tmdbId == null) return Optional.empty();
        try {
            String detailsUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{id}")
                    .buildAndExpand(tmdbId)
                    .toUriString();

            ResponseEntity<Map> detailsResponse = restTemplate.exchange(
                    detailsUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (!detailsResponse.getStatusCode().is2xxSuccessful() || detailsResponse.getBody() == null) {
                log.warn("TMDB details returned non-success for id={}", tmdbId);
                return Optional.empty();
            }

            Map<String, Object> body = detailsResponse.getBody();

            String posterUrl = null;
            String genres = null;
            String title = (String) body.get("title");
            String description = (String) body.get("overview");

            String posterPath = (String) body.get("poster_path");
            if (posterPath != null) {
                posterUrl = imageBaseUrl + posterPath;
            }

            Object genresObj = body.get("genres");
            if (genresObj instanceof List<?> gList) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> genreMaps = (List<Map<String, Object>>) gList;
                genres = genreMaps.stream()
                        .map(m -> (String) m.get("name"))
                        .filter(n -> n != null && !n.isBlank())
                        .collect(Collectors.joining(", "));
            }

            AdminMovie movie = new AdminMovie();
            movie.setTmdbId(tmdbId);
            movie.setTitle(title);
            movie.setPosterUrl(posterUrl);
            movie.setGenres(genres);
            movie.setDescription(description);
            movie.setActive(true);

            return Optional.of(movie);
        } catch (Exception e) {
            log.error("Error fetching TMDB data for id={}", tmdbId, e);
            return Optional.empty();
        }
    }

    /**
     * Fetch only poster URL for a TMDB movie id (for enriching responses when posterUrl is null).
     */
    public String getPosterUrl(Integer tmdbId) {
        if (tmdbId == null) return null;
        try {
            String detailsUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{id}")
                    .buildAndExpand(tmdbId)
                    .toUriString();
            ResponseEntity<Map> response = restTemplate.exchange(
                    detailsUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null)
                return null;
            String posterPath = (String) response.getBody().get("poster_path");
            return posterPath != null ? imageBaseUrl + posterPath : null;
        } catch (Exception e) {
            log.debug("Could not fetch poster for tmdbId={}", tmdbId, e);
            return null;
        }
    }

    /**
     * Search TMDB movies by title and return lightweight DTOs for admin selection.
     */
    public List<AdminTmdbSearchMovie> searchMovies(String query) {
        try {
            String searchUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/search/movie")
                    .queryParam("query", query)
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("TMDB search returned non-success for query={}", query);
                return List.of();
            }

            Object resultsObj = response.getBody().get("results");
            if (!(resultsObj instanceof List<?> results) || results.isEmpty()) {
                return List.of();
            }

            return results.stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(m -> {
                        Integer id = m.get("id") instanceof Number
                                ? ((Number) m.get("id")).intValue()
                                : null;
                        String title = (String) m.get("title");
                        String overview = (String) m.get("overview");
                        String releaseDate = (String) m.get("release_date");
                        String posterPath = (String) m.get("poster_path");
                        String posterUrl = posterPath != null ? imageBaseUrl + posterPath : null;
                        return new AdminTmdbSearchMovie(id, title, overview, posterUrl, releaseDate);
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Error searching TMDB for query={}", query, e);
            return List.of();
        }
    }
}

