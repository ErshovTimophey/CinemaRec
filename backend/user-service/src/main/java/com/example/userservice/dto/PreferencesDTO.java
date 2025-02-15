package com.example.userservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class PreferencesDTO {
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private List<String> favoriteMovies;
    private Double minRating;
}
