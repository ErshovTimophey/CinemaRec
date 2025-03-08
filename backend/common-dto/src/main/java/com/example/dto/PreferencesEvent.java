package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PreferencesEvent {
    private String email;
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private List<String> favoriteMovies;
    private List<String> favoriteDirectors;
    private Double minRating;
}
