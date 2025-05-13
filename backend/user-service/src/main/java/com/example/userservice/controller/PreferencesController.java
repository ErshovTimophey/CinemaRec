package com.example.userservice.controller;

import com.example.userservice.dto.GetPreferencesDTO;
import com.example.userservice.dto.PreferencesDTO;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.service.PreferencesService;
import com.example.userservice.service.TmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.userservice.model.FavoriteMovie;
import com.example.userservice.model.FavoriteActor;
import com.example.userservice.model.FavoriteDirector;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users/{email}/preferences")
@RequiredArgsConstructor
public class PreferencesController {

    private final PreferencesService preferencesService;
    private final TmdbService tmdbService;

    @PutMapping
    public ResponseEntity<UserPreferences> updatePreferences(
            @PathVariable String email,
            @RequestBody PreferencesDTO dto) {
        return ResponseEntity.ok(preferencesService.updatePreferences(email, dto));
    }

    @GetMapping
    public ResponseEntity<?> getPreferences(@PathVariable String email) {
        try {
            UserPreferences preferences = preferencesService.getPreferences(email);
            GetPreferencesDTO dto = GetPreferencesDTO.fromEntity(preferences);

            // Fetch TMDB data for favorite movies, actors, and directors
            List<Map<String, Object>> favoriteMovies = preferences.getFavoriteMovies().stream()
                    .map(FavoriteMovie::getMovie)
                    .map(Long::valueOf) // Convert String to Long
                    .map(tmdbService::getMovieById)
                    .filter(movie -> movie != null && !movie.isEmpty())
                    .collect(Collectors.toList());

            List<Map<String, Object>> favoriteActors = preferences.getFavoriteActors().stream()
                    .map(FavoriteActor::getActor)
                    .map(Long::valueOf) // Convert String to Long
                    .map(tmdbService::getPersonById)
                    .filter(person -> person != null && "Acting".equals(person.get("known_for_department")))
                    .collect(Collectors.toList());

            List<Map<String, Object>> favoriteDirectors = preferences.getFavoriteDirectors().stream()
                    .map(FavoriteDirector::getDirector)
                    .map(Long::valueOf) // Convert String to Long
                    .map(tmdbService::getPersonById)
                    .filter(person -> person != null && "Directing".equals(person.get("known_for_department")))
                    .collect(Collectors.toList());

            // Build response with preferences and TMDB data
            Map<String, Object> response = new HashMap<>();
            response.put("preferences", dto);
            response.put("favoriteMovies", favoriteMovies);
            response.put("favoriteActors", favoriteActors);
            response.put("favoriteDirectors", favoriteDirectors);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("Error fetching preferences for email: " + email);
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
}