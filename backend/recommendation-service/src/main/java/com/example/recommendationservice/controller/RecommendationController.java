package com.example.recommendationservice.controller;

import com.example.recommendationservice.model.Recommendation;
import com.example.recommendationservice.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;

    @GetMapping("/{email}")
    public ResponseEntity<List<Recommendation>> getRecommendations(@PathVariable String email) {
        List<Recommendation> recommendations = recommendationService.getRecommendationsForUser(email);
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/{email}/watched/{movieId}")
    public ResponseEntity<Void> markAsWatched(
            @PathVariable String email,
            @PathVariable Integer movieId) {
        recommendationService.markMovieAsWatched(email, movieId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{email}/refresh")
    public ResponseEntity<Void> refreshRecommendations(@PathVariable String email) {
        // This would trigger a new preferences event in a real scenario
        return ResponseEntity.ok().build();
    }
}