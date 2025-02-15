package com.example.recommendationservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class PreferencesEvent {
    private String email;
    private List<Integer> favoriteGenres;
    private List<Integer> favoriteActors;
    private List<Integer> favoriteMovies;
    private Double minRating;
}