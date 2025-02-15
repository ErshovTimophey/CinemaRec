package com.example.recommendationservice.service;

import com.example.dto.PreferencesEvent;
import com.example.recommendationservice.dto.TmdbMovie;
import com.example.recommendationservice.model.Recommendation;
import com.example.recommendationservice.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {
    private final TmdbService tmdbService;
    private final RecommendationRepository recommendationRepository;

    @KafkaListener(topics = "user-preferences", groupId = "recommendation-group")
    @Transactional
    public void handlePreferencesEvent(PreferencesEvent event) {
        System.out.println("ПОЛУЧИЛ ДАННЫЕ ЧЕРЕЗ КАФКА" + event.getEmail());
        log.info("Received preferences event for user: {}", event.getEmail());

        // Delete old recommendations
        recommendationRepository.deleteByEmail(event.getEmail());

        // Get new recommendations from TMDB
        List<TmdbMovie> recommendedMovies = tmdbService.getRecommendations(
                event.getFavoriteGenres(),
                event.getFavoriteActors(),
                event.getFavoriteMovies(),
                event.getMinRating()
        );

        // Save recommendations
        List<Recommendation> recommendations = recommendedMovies.stream()
                .map(movie -> {
                    Recommendation rec = new Recommendation();
                    rec.setEmail(event.getEmail());
                    rec.setMovieId(movie.getId());
                    rec.setMovieTitle(movie.getTitle());
                    rec.setPosterUrl(tmdbService.getFullPosterUrl(movie.getPosterPath()));
                    rec.setRating(movie.getVoteAverage());
                    rec.setOverview(movie.getOverview());
                    rec.setWatched(false);
                    return rec;
                })
                .collect(Collectors.toList());

        recommendationRepository.saveAll(recommendations);
        log.info("Saved {} recommendations for user: {}", recommendations.size(), event.getEmail());
    }

    public List<Recommendation> getRecommendationsForUser(String email) {
        return recommendationRepository.findByEmail(email);
    }

    @Transactional
    public void markMovieAsWatched(String email, Integer movieId) {
        recommendationRepository.findByEmailAndMovieId(email, movieId)
                .ifPresent(recommendation -> {
                    recommendation.setWatched(true);
                    recommendationRepository.save(recommendation);
                });
    }
}