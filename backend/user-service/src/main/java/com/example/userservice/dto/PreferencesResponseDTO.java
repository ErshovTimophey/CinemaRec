package com.example.userservice.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PreferencesResponseDTO {
    private GetPreferencesDTO preferences;
    private List<Map<String, Object>> favoriteMovies;
    private List<Map<String, Object>> favoriteActors;
    private List<Map<String, Object>> favoriteDirectors;
}