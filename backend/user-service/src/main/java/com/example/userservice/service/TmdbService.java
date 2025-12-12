package com.example.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
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
        // Use Bearer token from config (remove "Bearer " prefix if present)
        String token = tmdbApiKey.startsWith("Bearer ") ? tmdbApiKey.substring(7) : tmdbApiKey;
        headers.set("Authorization", "Bearer " + token);
        log.info("TMDB API headers initialized. Base URL: {}", tmdbBaseUrl);
    }

    // Fetch genres with caching
    public List<Map<String, Object>> getGenres() {
        String cacheKey = "tmdb:genres";
        List<Map<String, Object>> cachedGenres = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedGenres != null) {
            log.debug("Returning cached genres");
            return cachedGenres;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/genre/movie/list")
                .toUriString();

        log.info("Fetching genres from TMDB API: {}", url);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getStatusCode() != HttpStatus.OK) {
                log.error("TMDB API returned non-OK status: {} for URL: {}", response.getStatusCode(), url);
                return Collections.emptyList();
            }

            if (response.getBody() == null) {
                log.warn("TMDB API returned null body for genres");
                return Collections.emptyList();
            }

            List<Map<String, Object>> genres = (List<Map<String, Object>>) response.getBody().get("genres");
            if (genres != null && !genres.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, genres, CACHE_TTL_HOURS, TimeUnit.HOURS);
                log.info("Successfully fetched {} genres from TMDB API", genres.size());
                return genres;
            } else {
                log.warn("TMDB API returned empty genres list");
                return Collections.emptyList();
            }
        } catch (ResourceAccessException e) {
            log.error("Network error fetching genres from TMDB API: {}. URL: {}", e.getMessage(), url, e);
            // Return cached data if available, even if expired
            return Collections.emptyList();
        } catch (RestClientException e) {
            log.error("REST client error fetching genres from TMDB API: {}. URL: {}", e.getMessage(), url, e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error fetching genres from TMDB API: {}. URL: {}", e.getMessage(), url, e);
            return Collections.emptyList();
        }
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
                .queryParam("page", page)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> movies = (List<Map<String, Object>>) response.getBody().get("results");
        List<Map<String, Object>> filteredMovies = movies.stream()
                .filter(movie -> {
                    Object voteAverage = movie.get("vote_average");
                    return voteAverage instanceof Number && ((Number) voteAverage).doubleValue() > 7.0;
                })
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, filteredMovies, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return filteredMovies;
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

    public byte[] getMoviePoster(Long movieId) {
        String cacheKey = "poster:" + movieId;
        String cachedBase64 = (String) redisTemplate.opsForValue().get(cacheKey);
        if (cachedBase64 != null && !cachedBase64.isEmpty()) {
            try {
                return Base64.getDecoder().decode(cachedBase64);
            } catch (IllegalArgumentException e) {
                redisTemplate.delete(cacheKey); // Remove invalid cache entry
            }
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/movie/{id}")
                .buildAndExpand(movieId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null || response.getBody().get("poster_path") == null) {
            return null;
        }

        String posterPath = (String) response.getBody().get("poster_path");
        String posterUrl = "https://image.tmdb.org/t/p/w500" + posterPath;

        ResponseEntity<byte[]> posterResponse = restTemplate.exchange(
                posterUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);

        if (posterResponse.getStatusCode() == HttpStatus.OK && posterResponse.getBody() != null) {
            String base64Image = Base64.getEncoder().encodeToString(posterResponse.getBody());
            redisTemplate.opsForValue().set(cacheKey, base64Image, CACHE_TTL_HOURS, TimeUnit.HOURS);
            return posterResponse.getBody();
        }
        return null;
    }

    public byte[] getPersonProfile(Long personId) {
        String cacheKey = "profile:" + personId;
        String cachedBase64 = (String) redisTemplate.opsForValue().get(cacheKey);
        if (cachedBase64 != null && !cachedBase64.isEmpty()) {
            try {
                return Base64.getDecoder().decode(cachedBase64);
            } catch (IllegalArgumentException e) {
                redisTemplate.delete(cacheKey); // Remove invalid cache entry
            }
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{id}")
                .buildAndExpand(personId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getBody() == null || response.getBody().get("profile_path") == null) {
            return null;
        }

        String profilePath = (String) response.getBody().get("profile_path");
        String profileUrl = "https://image.tmdb.org/t/p/w200" + profilePath;

        ResponseEntity<byte[]> profileResponse = restTemplate.exchange(
                profileUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);

        if (profileResponse.getStatusCode() == HttpStatus.OK && profileResponse.getBody() != null) {
            String base64Image = Base64.getEncoder().encodeToString(profileResponse.getBody());
            redisTemplate.opsForValue().set(cacheKey, base64Image, CACHE_TTL_HOURS, TimeUnit.HOURS);
            return profileResponse.getBody();
        }
        return null;
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