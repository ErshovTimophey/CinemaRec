package com.example.userservice.service;

import com.example.cinemarec.grpc.recommendation.GetRecommendationsRequest;
import com.example.cinemarec.grpc.recommendation.RecommendationServiceGrpc;
import com.example.dto.PreferencesEvent;
import com.example.userservice.dto.GetPreferencesDTO;
import com.example.userservice.dto.PreferencesResponseDTO;
import com.example.userservice.dto.RecommendationDto;
import com.example.userservice.model.User;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.repository.UserRepository;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final UserRepository userRepository;

    @GrpcClient("recommendation-service")
    private RecommendationServiceGrpc.RecommendationServiceBlockingStub recommendationStub;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private KafkaTemplate<String, PreferencesEvent> kafkaTemplate;

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<RecommendationDto> getUserRecommendations(String email) {
        try {
            var response = recommendationStub.getRecommendations(
                    GetRecommendationsRequest.newBuilder().setEmail(email).build());
            return response.getItemsList().stream()
                    .map(item -> {
                        RecommendationDto dto = new RecommendationDto();
                        dto.setId(item.getId());
                        dto.setEmail(item.getEmail());
                        dto.setMovieId(item.getMovieId());
                        dto.setMovieTitle(item.getMovieTitle());
                        dto.setPosterUrl(item.getPosterUrl());
                        dto.setRating(item.getRating());
                        dto.setOverview(item.getOverview());
                        dto.setGenres(item.getGenres());
                        dto.setWatched(item.getWatched());
                        dto.setCategory(item.getCategory());
                        if (!item.getRecommendedAt().isEmpty()) {
                            try {
                                dto.setRecommendedAt(LocalDateTime.parse(item.getRecommendedAt(), ISO));
                            } catch (Exception ignored) {}
                        }
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (StatusRuntimeException e) {
            throw new RuntimeException("gRPC recommendation-service failed: " + e.getStatus(), e);
        }
    }

    public void refreshRecommendations(String email) {
        try {
            // Вызываем эндпоинт PreferencesController для получения предпочтений
            String preferencesUrl = "http://user-service:8082/users/" + email + "/preferences";
            ResponseEntity<PreferencesResponseDTO> response = restTemplate.getForEntity(preferencesUrl, PreferencesResponseDTO.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                GetPreferencesDTO preferences = response.getBody().getPreferences();

                if (preferences == null) {
                    System.out.println("No preferences found in response for user: " + email);
                    return;
                }

                // Формируем PreferencesEvent
                PreferencesEvent event = new PreferencesEvent();
                event.setEmail(email);
                event.setFavoriteGenres(preferences.getFavoriteGenres());
                event.setFavoriteActors(preferences.getFavoriteActors());
                event.setFavoriteDirectors(preferences.getFavoriteDirectors());
                event.setFavoriteMovies(preferences.getFavoriteMovies());
                event.setMinRating(preferences.getMinRating());

                // Отправляем событие в Kafka
                kafkaTemplate.send("user-preferences", email, event);
                System.out.println("ОТПРАВИЛ ОБНОВЛЁННЫЕ ДАННЫЕ " + email);
            } else {
                System.out.println("Error refreshing recommendations for user: " + email + ", status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.out.println("Error refreshing recommendations for user: " + email);
            e.printStackTrace();
        }
    }
}