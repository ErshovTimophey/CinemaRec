package com.example.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PreferencesEvent {
    private String email;
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private Double minRating;
}
