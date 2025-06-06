package com.example.recommendationservice.service;

import com.example.recommendationservice.dto.TmdbMovie;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
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
    private final RedisTemplate<String, Object> redisTemplate;
    private final HttpHeaders headers;
    private final Executor executor = Executors.newFixedThreadPool(4); // Thread pool for parallel calls

    private final RedisTemplate<String, String> imageRedisTemplate;

    @Getter
    private final Map<Integer, String> genreMap = new HashMap<>();

    private static final int MIN_VOTE_COUNT = 100;
    private static final double MIN_POPULARITY = 10.0;
    private static final String EXCLUDE_COUNTRY = "IN";

    public TmdbService(RestTemplate restTemplate, RedisTemplate<String,
                       Object> redisTemplate,
                       RedisTemplate<String, String> imageRedisTemplate) {
        this.restTemplate = restTemplate;
        this.redisTemplate = redisTemplate;
        this.imageRedisTemplate = imageRedisTemplate;
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
            Set<Integer> usedMovieIds = new HashSet<>();

            CompletableFuture<List<TmdbMovie>> movieRecommendationsFuture = CompletableFuture.supplyAsync(() -> {
                List<TmdbMovie> movies = new ArrayList<>();
                for (String movieId : favoriteMovies) {
                    movies.addAll(getSimilarMovies(movieId, 2)); // Reduced to 2 pages
                }
                return movies;
            }, executor);

            CompletableFuture<List<TmdbMovie>> actorRecommendationsFuture = CompletableFuture.supplyAsync(() -> {
                List<TmdbMovie> movies = new ArrayList<>();
                for (String actorId : favoriteActors) {
                    movies.addAll(getMoviesByPerson(actorId, "cast"));
                }
                return movies;
            }, executor);

            CompletableFuture<List<TmdbMovie>> directorRecommendationsFuture = CompletableFuture.supplyAsync(() -> {
                List<TmdbMovie> movies = new ArrayList<>();
                for (String directorId : favoriteDirectors) {
                    movies.addAll(getMoviesByPerson(directorId, "crew"));
                }
                return movies;
            }, executor);

            CompletableFuture<List<TmdbMovie>> genreRecommendationsFuture = CompletableFuture.supplyAsync(() -> {
                String[] sortOptions = {"popularity.desc", "vote_average.desc", "release_date.desc"};
                String sortBy = sortOptions[random.nextInt(sortOptions.length)];
                return discoverMovies(favoriteGenres, minRating, sortBy, 2); // Reduced to 2 pages
            }, executor);

            CompletableFuture.allOf(
                    movieRecommendationsFuture,
                    actorRecommendationsFuture,
                    directorRecommendationsFuture,
                    genreRecommendationsFuture
            ).join();

            result.setMovieRecommendations(filterAndLimit(movieRecommendationsFuture.join(), minRating, random, 20, usedMovieIds));
            result.setActorRecommendations(filterAndLimit(actorRecommendationsFuture.join(), minRating, random, 20, usedMovieIds));
            result.setDirectorRecommendations(filterAndLimit(directorRecommendationsFuture.join(), minRating, random, 20, usedMovieIds));
            result.setGenreRecommendations(filterAndLimit(genreRecommendationsFuture.join(), minRating, random, 20, usedMovieIds));

            return result;
        } catch (Exception e) {
            log.error("Error getting recommendations from TMDB", e);
            return new RecommendationsByCategory();
        }
    }

    private List<TmdbMovie> filterAndLimit(List<TmdbMovie> movies, Double minRating, Random random, int limit, Set<Integer> usedMovieIds) {
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

        selectedMovies.forEach(movie -> usedMovieIds.add(movie.getId()));
        log.debug("Filtered and selected {} movies, new usedMovieIds size: {}", selectedMovies.size(), usedMovieIds.size());

        return selectedMovies;
    }

    private List<TmdbMovie> getSimilarMovies(String movieId, int pages) {
        String cacheKey = "similar_movies:" + movieId;
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        List<TmdbMovie> cached = null;

        if (cachedObject instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<TmdbMovie> temp = (List<TmdbMovie>) cachedObject;
                cached = temp.stream()
                        .filter(TmdbMovie.class::isInstance)
                        .map(TmdbMovie.class::cast)
                        .toList();
                log.debug("Cache hit for similar movies: {} ({} movies)", movieId, cached.size());
            } catch (Exception e) {
                log.error("Failed to cast cached data to List<TmdbMovie> for key={}", cacheKey, e);
            }
        }

        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

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
        redisTemplate.opsForValue().set(cacheKey, movies, 1, TimeUnit.HOURS);
        log.debug("Cached similar movies for movieId={}: {} movies", movieId, movies.size());
        return movies;
    }

    private List<TmdbMovie> getMoviesByPerson(String personId, String creditType) {
        String cacheKey = "person_credits:" + personId + ":" + creditType;
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        List<TmdbMovie> cached = null;

        if (cachedObject instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<TmdbMovie> temp = (List<TmdbMovie>) cachedObject;
                cached = temp.stream()
                        .filter(TmdbMovie.class::isInstance)
                        .map(TmdbMovie.class::cast)
                        .toList();
                log.debug("Cache hit for person credits: {} ({}) ({} movies)", personId, creditType, cached.size());
            } catch (Exception e) {
                log.error("Failed to cast cached data to List<TmdbMovie> for key={}", cacheKey, e);
            }
        }

        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl)
                .path("/person/{personId}/movie_credits")
                .queryParam("vote_count.gte", MIN_VOTE_COUNT)
                .buildAndExpand(personId)
                .toUriString();

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List<Map<String, Object>> credits = (List<Map<String, Object>>) response.getBody().get(creditType);
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
            redisTemplate.opsForValue().set(cacheKey, movies, 1, TimeUnit.HOURS);
            log.debug("Cached person credits for personId={} (type={}): {} movies", personId, creditType, movies.size());
            return movies;
        }
        return Collections.emptyList();
    }

    private List<TmdbMovie> discoverMovies(List<String> genres, Double minRating, String sortBy, int pages) {
        String cacheKey = "discover_movies:" + String.join(",", genres) + ":" + minRating + ":" + sortBy;
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        List<TmdbMovie> cached = null;

        if (cachedObject instanceof List) {
            try {
                @SuppressWarnings("unchecked")
                List<TmdbMovie> temp = (List<TmdbMovie>) cachedObject;
                cached = temp.stream()
                        .filter(TmdbMovie.class::isInstance)
                        .map(TmdbMovie.class::cast)
                        .toList();
                log.debug("Cache hit for discover movies: {} ({} movies)", cacheKey, cached.size());
            } catch (Exception e) {
                log.error("Failed to cast cached data to List<TmdbMovie> for key={}", cacheKey, e);
            }
        }

        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

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
        redisTemplate.opsForValue().set(cacheKey, movies, 1, TimeUnit.HOURS);
        log.debug("Cached discover movies for genres={}: {} movies", genreQuery, movies.size());
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

            return details;
        } catch (Exception e) {
            log.error("Error fetching movie details for movieId={}", movieId, e);
            return new MovieDetails();
        }
    }

    public byte[] getMoviePoster(Integer movieId) {
        try {
            String cacheKey = "poster:" + movieId;
            String cachedBase64 = imageRedisTemplate.opsForValue().get(cacheKey);
            if (cachedBase64 != null && !cachedBase64.isEmpty()) {
                log.debug("Cache hit for poster: movieId={}", movieId);
                try {
                    return Base64.getDecoder().decode(cachedBase64);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid Base64 in cache for movieId={}: {}", movieId, e.getMessage());
                    imageRedisTemplate.delete(cacheKey); // Remove invalid cache entry
                }
            }

            MovieDetails details = getMovieDetails(movieId);
            if (details == null || details.getPosterPath() == null) {
                log.warn("No poster path found for movieId={}", movieId);
                return null;
            }

            String posterUrl = getFullPosterUrl(details.getPosterPath());
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    posterUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String base64Image = Base64.getEncoder().encodeToString(response.getBody());
                imageRedisTemplate.opsForValue().set(cacheKey, base64Image, 1, TimeUnit.HOURS);
                log.debug("Cached poster for movieId={}", movieId);
                return response.getBody();
            }
            log.warn("Failed to fetch poster for movieId={}: HTTP {}", movieId, response.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Error fetching poster for movieId={}", movieId, e);
            return null;
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