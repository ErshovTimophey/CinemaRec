package com.example.recommendationservice.controller;


import com.example.recommendationservice.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tmdb")
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/movie/{id}")
    public ResponseEntity<String> getMovieById(@PathVariable("id") String movieId) {
        return tmdbService.fetchMovieDetails(movieId);
    }

    @GetMapping("/discover")
    public ResponseEntity<String> discoverMovies(
            @RequestParam Map<String, String> queryParams
    ) {
        return tmdbService.discoverMovies(queryParams);
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchMovies(
            @RequestParam("query") String query
    ) {
        return tmdbService.searchMovies(query);
    }
}
