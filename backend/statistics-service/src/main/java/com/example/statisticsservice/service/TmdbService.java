package com.example.statisticsservice.service;

import com.example.statisticsservice.dto.MovieDetails;
import com.example.statisticsservice.dto.MovieVideo;
import com.example.statisticsservice.dto.TmdbMovie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.concurrent.TimeUnit;
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
    public byte[] getMoviePoster(Long movieId) {
        try {
            MovieDetails details = getMovieDetails(movieId.intValue());
            if (details == null || details.getPosterPath() == null) {
                log.warn("No poster path found for movieId: {}", movieId);
                return null;
            }

            String posterUrl = getFullPosterUrl(details.getPosterPath());
            ResponseEntity<byte[]> posterResponse = restTemplate.exchange(
                    posterUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);

            if (posterResponse.getStatusCode() == HttpStatus.OK && posterResponse.getBody() != null) {
                log.debug("Successfully fetched poster for movieId: {}", movieId);
                return posterResponse.getBody();
            }
            log.warn("Failed to fetch poster for movieId: {}, HTTP status: {}", movieId, posterResponse.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Error fetching poster for movieId: {}", movieId, e);
            return null;
        }
    }


    public List<TmdbMovie> searchMovies(String query, int page) {
        try {
            String endpoint = query.isEmpty() ? "/movie/popular" : "/search/movie";
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path(endpoint)
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
                        .filter(movie -> {
                            Object voteAverage = movie.get("vote_average");
                            Object voteCount = movie.get("vote_count");
                            Object popularity = movie.get("popularity");
                            boolean hasHighRating = voteAverage instanceof Number && ((Number) voteAverage).doubleValue() > 7.0;
                            boolean hasEnoughVotes = voteCount instanceof Number && ((Number) voteCount).intValue() >= MIN_VOTE_COUNT;
                            boolean hasEnoughPopularity = popularity instanceof Number && ((Number) popularity).doubleValue() >= MIN_POPULARITY;
                            return hasHighRating && hasEnoughVotes && hasEnoughPopularity;
                        })
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

    public List<MovieVideo> getMovieVideos(Integer movieId) {
        try {
            log.info("Starting to fetch videos for movieId: {}", movieId);
            String videosUrl = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                    .path("/movie/{movieId}/videos")
                    .buildAndExpand(movieId)
                    .toUriString();
            
            log.info("Fetching videos from URL: {}", videosUrl);
            ResponseEntity<Map> response = restTemplate.exchange(
                    videosUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            
            log.info("Received response with status: {} for movieId: {}", response.getStatusCode(), movieId);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody.get("results") instanceof List<?>) {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");
                    log.debug("Found {} total videos for movieId: {}", results.size(), movieId);
                    
                    // First, try to get trailers and teasers
                    List<MovieVideo> preferredVideos = results.stream()
                            .filter(video -> {
                                String site = (String) video.get("site");
                                String type = (String) video.get("type");
                                boolean isYouTube = "YouTube".equals(site);
                                boolean isTrailerOrTeaser = "Trailer".equals(type) || "Teaser".equals(type);
                                
                                if (isYouTube) {
                                    log.info("Found YouTube video - site: {}, type: {}, name: {}", 
                                            site, type, video.get("name"));
                                }
                                
                                return isYouTube && isTrailerOrTeaser;
                            })
                            .map(this::mapToMovieVideo)
                            .filter(video -> video != null) // Filter out null videos
                            .collect(Collectors.toList());
                    
                    // If we have preferred videos, return them
                    if (!preferredVideos.isEmpty()) {
                        log.info("Found {} trailers/teasers for movieId: {}", preferredVideos.size(), movieId);
                        return preferredVideos;
                    }
                    
                    // Otherwise, return any YouTube videos (clips, featurettes, etc.)
                    List<MovieVideo> allYouTubeVideos = results.stream()
                            .filter(video -> {
                                String site = (String) video.get("site");
                                return "YouTube".equals(site);
                            })
                            .map(this::mapToMovieVideo)
                            .filter(video -> video != null) // Filter out null videos
                            .collect(Collectors.toList());
                    
                    if (!allYouTubeVideos.isEmpty()) {
                        log.info("Found {} YouTube videos (no trailers) for movieId: {}", 
                                allYouTubeVideos.size(), movieId);
                        return allYouTubeVideos;
                    }
                    
                    log.warn("No YouTube videos found for movieId: {}. Total videos: {}", movieId, results.size());
                    // Log all video types for debugging
                    results.forEach(video -> {
                        log.info("Video - site: {}, type: {}, name: {}", 
                                video.get("site"), video.get("type"), video.get("name"));
                    });
                } else {
                    log.warn("No 'results' field in response for movieId: {}", movieId);
                }
            } else {
                log.warn("Invalid response status for movieId: {}, status: {}", movieId, response.getStatusCode());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching videos for movieId: {}", movieId, e);
            return Collections.emptyList();
        }
    }

    private MovieVideo mapToMovieVideo(Map<String, Object> videoMap) {
        MovieVideo video = new MovieVideo();
        
        Object idObj = videoMap.get("id");
        if (idObj != null) {
            video.setId(idObj.toString());
        }
        
        video.setKey((String) videoMap.get("key"));
        video.setName((String) videoMap.get("name"));
        video.setSite((String) videoMap.get("site"));
        video.setType((String) videoMap.get("type"));
        
        if (videoMap.get("size") instanceof Number) {
            video.setSize(((Number) videoMap.get("size")).intValue());
        }
        
        // Validate that we have at least a key (required for YouTube URL)
        if (video.getKey() == null || video.getKey().isEmpty()) {
            log.warn("Video has no key, skipping: {}", videoMap);
            return null;
        }
        
        return video;
    }
}