package com.example.userservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private final RestTemplate restTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private HttpHeaders headers;

    @Value("${tmdb.api.base-url}")
    private String tmdbBaseUrl;

    @Value("${tmdb.api.key}")
    private String tmdbApiKey;

    private static final long CACHE_TTL_HOURS = 24;

    // Initialize headers in a PostConstruct method to ensure proper setup
    @javax.annotation.PostConstruct
    private void initHeaders() {
        headers = new HttpHeaders();
        headers.set("accept", "application/json");
        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZDQ2MmI5MTYxZGM3NDIwMzI0NWVjMDcyOWRmZjM4NyIsIm5iZiI6MTc0NzA2MzAxOC41MzUsInN1YiI6IjY4MjIxMGVhMzJmNzNlMTJlNDczOTNjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Xx1dOcNyzFsIMIB3h3hD006NVEoZMFXsF6d7GVlUsTA");
    }

    // Fetch genres with caching
    public List<Map<String, Object>> getGenres() {
        String cacheKey = "tmdb:genres";
        List<Map<String, Object>> cachedGenres = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedGenres != null) {
            return cachedGenres;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/genre/movie/list")
                .queryParam("api_key", tmdbApiKey)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> genres = (List<Map<String, Object>>) response.getBody().get("genres");
        redisTemplate.opsForValue().set(cacheKey, genres, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return genres;
    }

    // Fetch popular persons (actors/directors) with caching
    public List<Map<String, Object>> getPopularPersons(int page, String department) {
        String cacheKey = String.format("tmdb:persons:page:%d:department:%s", page, department);
        List<Map<String, Object>> cachedPersons = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedPersons != null) {
            return cachedPersons;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/popular")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("page", page)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> persons = (List<Map<String, Object>>) response.getBody().get("results");
        List<Map<String, Object>> filteredPersons = persons.stream()
                .filter(person -> department.equals(person.get("known_for_department")))
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(cacheKey, filteredPersons, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return filteredPersons;
    }

    // Fetch popular movies with caching
    public List<Map<String, Object>> getPopularMovies(int page) {
        String cacheKey = String.format("tmdb:movies:page:%d", page);
        List<Map<String, Object>> cachedMovies = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedMovies != null) {
            return cachedMovies;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/movie/popular")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("page", page)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> movies = (List<Map<String, Object>>) response.getBody().get("results");
        redisTemplate.opsForValue().set(cacheKey, movies, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return movies;
    }

    // Search movies
    public List<Map<String, Object>> searchMovies(String query) {
        String cacheKey = String.format("tmdb:search:movies:%s", query);
        List<Map<String, Object>> cachedResults = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedResults != null) {
            return cachedResults;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/search/movie")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("query", query)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
        redisTemplate.opsForValue().set(cacheKey, results, 1, TimeUnit.HOURS); // Short TTL for search
        return results;
    }

    // Search persons (actors/directors)
    public List<Map<String, Object>> searchPersons(String query, String department) {
        String cacheKey = String.format("tmdb:search:persons:%s:department:%s", query, department);
        List<Map<String, Object>> cachedResults = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedResults != null) {
            return cachedResults;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/search/person")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("query", query)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> results = ((List<Map<String, Object>>) response.getBody().get("results")).stream()
                .filter(person -> department.equals(person.get("known_for_department")))
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(cacheKey, results, 1, TimeUnit.HOURS); // Short TTL for search
        return results;
    }

    // Fetch movie by ID
    public Map<String, Object> getMovieById(Long id) {
        String cacheKey = String.format("tmdb:movie:%d", id);
        Map<String, Object> cachedMovie = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedMovie != null) {
            return cachedMovie;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/movie/{id}")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(id)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return new HashMap<>();
        }

        Map<String, Object> movie = response.getBody();
        redisTemplate.opsForValue().set(cacheKey, movie, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return movie;
    }

    // Fetch person by ID
    public Map<String, Object> getPersonById(Long id) {
        String cacheKey = String.format("tmdb:person:%d", id);
        Map<String, Object> cachedPerson = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedPerson != null) {
            return cachedPerson;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{id}")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(id)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return new HashMap<>();
        }

        Map<String, Object> person = response.getBody();
        redisTemplate.opsForValue().set(cacheKey, person, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return person;
    }
}