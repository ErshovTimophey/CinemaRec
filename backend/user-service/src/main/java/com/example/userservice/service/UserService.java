package com.example.userservice.service;

import com.example.dto.PreferencesEvent;
import com.example.userservice.dto.GetPreferencesDTO;
import com.example.userservice.dto.PreferencesResponseDTO;
import com.example.userservice.dto.RecommendationDto;
import com.example.userservice.model.User;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.example.userservice.recommendation.RecommendationClient;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    @Autowired
    private final RecommendationClient recommendationClient;

    @Autowired
    private final RestTemplate restTemplate;


    @Autowired
    private final KafkaTemplate<String, PreferencesEvent> kafkaTemplate;

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<RecommendationDto> getUserRecommendations(String email) {
        return recommendationClient.getRecommendations(email);
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