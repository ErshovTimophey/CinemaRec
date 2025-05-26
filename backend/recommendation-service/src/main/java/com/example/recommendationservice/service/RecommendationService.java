package com.example.recommendationservice.service;

import com.example.dto.PreferencesEvent;
import com.example.recommendationservice.dto.TmdbMovie;
import com.example.recommendationservice.model.Recommendation;
import com.example.recommendationservice.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {
    private final TmdbService tmdbService;
    private final RecommendationRepository recommendationRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @KafkaListener(topics = "user-preferences", groupId = "recommendation-group")
    @Transactional
    public void handlePreferencesEvent(PreferencesEvent event) {
        log.info("Received preferences event for user: {}", event.getEmail());

        try {
            // Delete old recommendations
            recommendationRepository.deleteByEmail(event.getEmail());
            redisTemplate.delete("recommendations:" + event.getEmail()); // Invalidate cache

            // Get new recommendations from TMDB
            TmdbService.RecommendationsByCategory recommendations = tmdbService.getRecommendations(
                    event.getFavoriteGenres(),
                    event.getFavoriteActors(),
                    event.getFavoriteMovies(),
                    event.getFavoriteDirectors(),
                    event.getMinRating()
            );

            // Save recommendations by category
            List<Recommendation> allRecommendations = new ArrayList<>();
            allRecommendations.addAll(mapToRecommendations(recommendations.getActorRecommendations(), event.getEmail(), "actors"));
            allRecommendations.addAll(mapToRecommendations(recommendations.getGenreRecommendations(), event.getEmail(), "genres"));
            allRecommendations.addAll(mapToRecommendations(recommendations.getDirectorRecommendations(), event.getEmail(), "directors"));
            allRecommendations.addAll(mapToRecommendations(recommendations.getMovieRecommendations(), event.getEmail(), "movies"));

            // Save to database
            recommendationRepository.saveAll(allRecommendations);
            log.info("Saved {} recommendations for user: {}", allRecommendations.size(), event.getEmail());

            // Cache in Redis
            try {
                redisTemplate.opsForValue().set("recommendations:" + event.getEmail(), allRecommendations, 1, TimeUnit.HOURS);
                log.debug("Cached recommendations for user: {}", event.getEmail());
            } catch (Exception e) {
                log.error("Failed to cache recommendations for user: {}", event.getEmail(), e);
                // Continue without failing the listener
            }
        } catch (Exception e) {
            log.error("Error processing preferences event for user: {}", event.getEmail(), e);
            throw new RuntimeException("Failed to process preferences event", e); // Re-throw for Kafka retry
        }
    }

    private List<Recommendation> mapToRecommendations(List<TmdbMovie> movies, String email, String category) {
        return movies.stream()
                .map(movie -> {
                    Recommendation rec = new Recommendation();
                    rec.setEmail(email);
                    rec.setMovieId(movie.getId());
                    rec.setMovieTitle(movie.getTitle());
                    rec.setPosterUrl(tmdbService.getFullPosterUrl(movie.getPosterPath()));
                    rec.setRating(movie.getVoteAverage());
                    rec.setOverview(movie.getOverview());
                    rec.setWatched(false);
                    rec.setCategory(category);

                    tmdbService.loadGenresIfNeeded();
                    List<String> genreNames = movie.getGenreIds().stream()
                            .map(tmdbService.getGenreMap()::get)
                            .filter(Objects::nonNull)
                            .toList();
                    if (!genreNames.isEmpty()) {
                        rec.setGenres(String.join(", ", genreNames));
                    } else {
                        rec.setGenres(null);
                    }
                    return rec;
                })
                .collect(Collectors.toList());
    }

    public List<Recommendation> getRecommendationsForUser(String email) {
        @SuppressWarnings("unchecked")
        List<Recommendation> cached = (List<Recommendation>) redisTemplate.opsForValue().get("recommendations:" + email);
        if (cached != null) {
            log.debug("Cache hit for recommendations: {}", email);
            return cached;
        }

        List<Recommendation> recommendations = recommendationRepository.findByEmail(email);
        try {
            redisTemplate.opsForValue().set("recommendations:" + email, recommendations, 1, TimeUnit.HOURS);
            log.debug("Cached recommendations for user: {}", email);
        } catch (Exception e) {
            log.error("Failed to cache recommendations for user: {}", email, e);
            // Return database results without failing
        }
        return recommendations;
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