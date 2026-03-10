package com.example.playbackservice.service;

import com.example.playbackservice.dto.MovieDetails;
import com.example.playbackservice.dto.MovieVideo;
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
public class TmdbPlaybackService {

    @Value("${tmdb.api.base-url}")
    private String tmdbBaseUrl;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;

    public TmdbPlaybackService(RestTemplate restTemplate,
                               @Value("${tmdb.api.bearer-token}") String bearerToken) {
        this.restTemplate = restTemplate;
        this.headers = new HttpHeaders();
        this.headers.set("accept", "application/json");
        this.headers.set("Authorization", bearerToken.startsWith("Bearer ") ? bearerToken : "Bearer " + bearerToken);
    }

    public MovieDetails getMovieDetails(Integer movieId) {
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
                        movieData.get("vote_average") instanceof Number
                                ? ((Number) movieData.get("vote_average")).doubleValue() : 0.0);
                details.setReleaseDate((String) movieData.get("release_date"));
                details.setRuntime(
                        movieData.get("runtime") instanceof Number
                                ? ((Number) movieData.get("runtime")).intValue() : 0);
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

            log.info("Playback: fetched details for movieId: {}", movieId);
            return details;
        } catch (Exception e) {
            log.error("Error fetching movie details for movieId: {}", movieId, e);
            return new MovieDetails();
        }
    }

    public List<MovieVideo> getMovieVideos(Integer movieId) {
        try {
            String videosUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}/videos")
                    .buildAndExpand(movieId)
                    .toUriString();
            ResponseEntity<Map> response = restTemplate.exchange(
                    videosUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object resultsObj = response.getBody().get("results");
                if (resultsObj instanceof List<?>) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) resultsObj;
                    List<MovieVideo> preferred = results.stream()
                            .filter(v -> "YouTube".equals(v.get("site")))
                            .filter(v -> "Trailer".equals(v.get("type")) || "Teaser".equals(v.get("type")))
                            .map(this::mapToMovieVideo)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                    if (!preferred.isEmpty()) return preferred;
                    List<MovieVideo> anyYouTube = results.stream()
                            .filter(v -> "YouTube".equals(v.get("site")))
                            .map(this::mapToMovieVideo)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                    return anyYouTube;
                }
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching videos for movieId: {}", movieId, e);
            return Collections.emptyList();
        }
    }

    public byte[] getMoviePoster(Long movieId) {
        try {
            MovieDetails details = getMovieDetails(movieId.intValue());
            if (details == null || details.getPosterPath() == null) return null;
            String posterUrl = imageBaseUrl + details.getPosterPath();
            ResponseEntity<byte[]> posterResponse = restTemplate.exchange(
                    posterUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
            if (posterResponse.getStatusCode() == HttpStatus.OK && posterResponse.getBody() != null) {
                return posterResponse.getBody();
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching poster for movieId: {}", movieId, e);
            return null;
        }
    }

    private MovieVideo mapToMovieVideo(Map<String, Object> m) {
        String key = (String) m.get("key");
        if (key == null || key.isEmpty()) return null;
        MovieVideo v = new MovieVideo();
        if (m.get("id") != null) v.setId(m.get("id").toString());
        v.setKey(key);
        v.setName((String) m.get("name"));
        v.setSite((String) m.get("site"));
        v.setType((String) m.get("type"));
        if (m.get("size") instanceof Number) v.setSize(((Number) m.get("size")).intValue());
        return v;
    }
}
