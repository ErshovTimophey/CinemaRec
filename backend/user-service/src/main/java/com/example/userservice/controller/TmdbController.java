package com.example.userservice.controller;

import com.example.userservice.service.TmdbService;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tmdb")
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/genres")
    public ResponseEntity<List<Map<String, Object>>> getGenres() {
        return ResponseEntity.ok(tmdbService.getGenres());
    }

    @GetMapping("/actors")
    public ResponseEntity<List<Map<String, Object>>> getActors(@RequestParam int page) {
        return ResponseEntity.ok(tmdbService.getPopularPersons(page, "Acting"));
    }

    @GetMapping("/directors")
    public ResponseEntity<List<Map<String, Object>>> getDirectors(@RequestParam int page) {
        return ResponseEntity.ok(tmdbService.getPopularPersons(page, "Directing"));
    }

    @GetMapping("/movies")
    public ResponseEntity<List<Map<String, Object>>> getMovies(@RequestParam int page) {
        return ResponseEntity.ok(tmdbService.getPopularMovies(page));
    }

    @GetMapping("/search/movies")
    public ResponseEntity<List<Map<String, Object>>> searchMovies(@RequestParam String query) {
        return ResponseEntity.ok(tmdbService.searchMovies(query));
    }

    @GetMapping("/search/actors")
    public ResponseEntity<List<Map<String, Object>>> searchActors(@RequestParam String query) {
        return ResponseEntity.ok(tmdbService.searchPersons(query, "Acting"));
    }

    @GetMapping("/search/directors")
    public ResponseEntity<List<Map<String, Object>>> searchDirectors(@RequestParam String query) {
        return ResponseEntity.ok(tmdbService.searchPersons(query, "Directing"));
    }
}