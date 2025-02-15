package com.example.userservice.service;

import com.example.dto.PreferencesEvent;
import com.example.userservice.dto.PreferencesDTO;
import com.example.userservice.model.FavoriteActor;
import com.example.userservice.model.FavoriteGenre;
import com.example.userservice.model.FavoriteMovie;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.repository.PreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

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
        preferences.setMinRating(dto.getMinRating());

        // Очистка старых коллекций
        preferences.getFavoriteGenres().clear();
        preferences.getFavoriteActors().clear();
        preferences.getFavoriteMovies().clear();

        // Добавление новых жанров
        for (String genre : dto.getFavoriteGenres()) {
            FavoriteGenre g = new FavoriteGenre();
            g.setGenre(genre);
            g.setUserPreferences(preferences);  // обязательно
            preferences.getFavoriteGenres().add(g);
        }

        // Добавление новых актёров
        for (String actor : dto.getFavoriteActors()) {
            FavoriteActor a = new FavoriteActor();
            a.setActor(actor);
            a.setUserPreferences(preferences);
            preferences.getFavoriteActors().add(a);
        }

        // Добавление новых фильмов
        for (String movie : dto.getFavoriteMovies()) {
            FavoriteMovie m = new FavoriteMovie();
            m.setMovie(movie);
            m.setUserPreferences(preferences);
            preferences.getFavoriteMovies().add(m);
        }

        UserPreferences saved = preferencesRepository.save(preferences);

        PreferencesEvent event = new PreferencesEvent(
                email,
                dto.getFavoriteGenres(),
                dto.getFavoriteActors(),
                dto.getFavoriteMovies(),
                dto.getMinRating()
        );
        System.out.println("ОТПРАВКА В КАФКУ");
        kafkaTemplate.send("user-preferences", event);
        return saved;
    }

    public UserPreferences getPreferences(String email) {
        return preferencesRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Preferences not found"));
    }


}