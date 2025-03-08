package com.example.userservice.dto;

import com.example.userservice.model.*;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class GetPreferencesDTO {
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private List<String> favoriteMovies;
    private List<String> favoriteDirectors;
    private Double minRating;

    public static GetPreferencesDTO fromEntity(UserPreferences preferences) {
        GetPreferencesDTO dto = new GetPreferencesDTO();
        dto.setFavoriteGenres(preferences.getFavoriteGenres().stream()
                .map(FavoriteGenre::getGenre)
                .collect(Collectors.toList()));
        dto.setFavoriteActors(preferences.getFavoriteActors().stream()
                .map(FavoriteActor::getActor)
                .collect(Collectors.toList()));
        dto.setFavoriteMovies(preferences.getFavoriteMovies().stream()
                .map(FavoriteMovie::getMovie)
                .collect(Collectors.toList()));
        dto.setFavoriteDirectors(preferences.getFavoriteDirectors().stream()
                .map(FavoriteDirector::getDirector)
                .collect(Collectors.toList()));
        dto.setMinRating(preferences.getMinRating());
        return dto;
    }
}
