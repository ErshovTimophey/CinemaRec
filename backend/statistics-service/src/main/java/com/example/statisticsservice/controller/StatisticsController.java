package com.example.statisticsservice.controller;

import com.example.statisticsservice.dto.MovieDetails;
import com.example.statisticsservice.dto.MovieVideo;
import com.example.statisticsservice.dto.StatisticsResponse;
import com.example.statisticsservice.dto.TmdbMovie;
import com.example.statisticsservice.model.WatchedMovie;
import com.example.statisticsservice.service.StatisticsService;
import com.example.statisticsservice.service.TmdbService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@Slf4j
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final TmdbService tmdbService;

    // Constructor to log when controller is initialized
    {
        log.info("=== StatisticsController initialized ===");
        log.info("=== Test endpoint available at /statistics/test-videos ===");
        log.info("=== Videos endpoint available at /statistics/movies/{movieId}/videos ===");
    }

    @GetMapping
    public ResponseEntity<StatisticsResponse> getStatistics(@RequestParam String email) {
        StatisticsResponse stats = statisticsService.getStatistics(email);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/test-videos")
    public ResponseEntity<String> testVideos() {
        log.info("TEST: Videos endpoint is accessible");
        return ResponseEntity.ok("Videos endpoint is working!");
    }

    @GetMapping("/watched")
    public ResponseEntity<List<WatchedMovie>> getWatchedMovies(@RequestParam String email) {
        List<WatchedMovie> watchedMovies = statisticsService.getWatchedMovies(email);
        return ResponseEntity.ok(watchedMovies);
    }

    @PostMapping("/watched")
    public ResponseEntity<Void> markAsWatched(
            @RequestParam String email,
            @RequestBody Map<String, Integer> body) {
        Integer movieId = body.get("movieId");
        if (movieId == null) {
            return ResponseEntity.badRequest().build();
        }
        statisticsService.markMovieAsWatched(email, movieId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/watched/{movieId}")
    public ResponseEntity<Void> removeFromWatched(
            @RequestParam String email,
            @PathVariable Integer movieId) {
        statisticsService.removeMovieFromWatched(email, movieId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/movies")
    public ResponseEntity<List<TmdbMovie>> searchMovies(
            @RequestParam String email,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "1") int page) {
        List<TmdbMovie> movies = tmdbService.searchMovies(query, page);
        return ResponseEntity.ok(movies);
    }

    // More specific route must come before less specific one
    @GetMapping(value = "/movies/{movieId}/videos", produces = "application/json")
    public ResponseEntity<List<MovieVideo>> getMovieVideos(
            @RequestParam(required = false) String email,
            @PathVariable Integer movieId) {
        log.info("=== VIDEO ENDPOINT CALLED === Received request for videos - movieId: {}, email: {}", movieId, email);
        try {
            List<MovieVideo> videos = tmdbService.getMovieVideos(movieId);
            log.info("Returning {} videos for movieId: {}", videos.size(), movieId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            log.error("Error in getMovieVideos endpoint", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/movies/{movieId}")
    public ResponseEntity<MovieDetails> getMovieDetails(
            @RequestParam String email,
            @PathVariable Integer movieId) {
        MovieDetails details = tmdbService.getMovieDetails(movieId);
        if (details.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }
}