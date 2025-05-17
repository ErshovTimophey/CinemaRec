package com.example.statisticsservice.controller;

import com.example.statisticsservice.dto.MovieDetails;
import com.example.statisticsservice.dto.StatisticsResponse;
import com.example.statisticsservice.dto.TmdbMovie;
import com.example.statisticsservice.model.WatchedMovie;
import com.example.statisticsservice.service.StatisticsService;
import com.example.statisticsservice.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final TmdbService tmdbService;

    @GetMapping
    public ResponseEntity<StatisticsResponse> getStatistics(@RequestParam String email) {
        StatisticsResponse stats = statisticsService.getStatistics(email);
        return ResponseEntity.ok(stats);
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