package com.example.userservice.service;

import com.example.userservice.dto.PreferencesDTO;
import com.example.userservice.dto.PreferencesEvent;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.repository.PreferencesRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PreferencesService {

    private final PreferencesRepository preferencesRepository;
    @Autowired
    private final KafkaTemplate<String, PreferencesEvent> kafkaTemplate;

    @Transactional
    public UserPreferences updatePreferences(String email, PreferencesDTO dto) {
        UserPreferences preferences = preferencesRepository.findByEmail(email)
                .orElse(new UserPreferences());

        preferences.setEmail(email);
        preferences.setFavoriteGenres(dto.getFavoriteGenres());
        preferences.setFavoriteActors(dto.getFavoriteActors());
        preferences.setMinRating(dto.getMinRating());

        UserPreferences saved = preferencesRepository.save(preferences);

        PreferencesEvent event = new PreferencesEvent(
                email,
                dto.getFavoriteGenres(),
                dto.getFavoriteActors(),
                dto.getMinRating()
        );
        kafkaTemplate.send("user-preferences", event);
        return saved;
    }

    public UserPreferences getPreferences(String email) {
        return preferencesRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Preferences not found"));
    }
}