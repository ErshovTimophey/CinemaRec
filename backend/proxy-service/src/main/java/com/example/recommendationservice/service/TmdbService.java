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
public class TmdbService {

    private final RestTemplate restTemplate;
    private final String BASE_URL = "https://api.themoviedb.org/3";
    private final HttpHeaders headers;

    public TmdbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;

        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA");
    }

    public ResponseEntity<String> fetchMovieDetails(String movieId) {
        String url = BASE_URL + "/movie/" + movieId;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    public ResponseEntity<String> discoverMovies(Map<String, String> queryParams) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/discover/movie");
        queryParams.forEach(builder::queryParam);
        return restTemplate.exchange(builder.toUriString(), HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    public ResponseEntity<String> searchMovies(String query) {
        String url = UriComponentsBuilder
                .fromHttpUrl(BASE_URL + "/search/movie")
                .queryParam("query", query)
                .toUriString();
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }
}
