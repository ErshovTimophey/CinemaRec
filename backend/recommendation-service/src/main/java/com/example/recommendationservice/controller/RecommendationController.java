package com.example.recommendationservice.controller;

import com.example.recommendationservice.model.Recommendation;
import com.example.recommendationservice.service.RecommendationService;
import com.example.recommendationservice.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;
    private final TmdbService tmdbService;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/{email}")
    public ResponseEntity<List<Recommendation>> getRecommendations(@PathVariable String email) {
        List<Recommendation> recommendations = recommendationService.getRecommendationsForUser(email);
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/{email}/watched/{movieId}")
    public ResponseEntity<Void> markAsWatched(@PathVariable String email, @PathVariable Integer movieId) {
        recommendationService.markMovieAsWatched(email, movieId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{email}/refresh")
    public ResponseEntity<Void> refreshRecommendations(@PathVariable String email) {
        redisTemplate.delete("recommendations:" + email); // Invalidate cache
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{email}/movies/{movieId}")
    public ResponseEntity<TmdbService.MovieDetails> getMovieDetails(
            @PathVariable String email, @PathVariable Integer movieId) {
        try {
            TmdbService.MovieDetails details = tmdbService.getMovieDetails(movieId);
            if (details == null || details.getId() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/{email}/movies/{movieId}/poster")
    public ResponseEntity<byte[]> getMoviePoster(@PathVariable String email, @PathVariable Integer movieId) {
        try {
            byte[] image = tmdbService.getMoviePoster(movieId);
            if (image == null) {
                return ResponseEntity.notFound().build();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            return new ResponseEntity<>(image, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}