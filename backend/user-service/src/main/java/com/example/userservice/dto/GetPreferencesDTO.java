package com.example.userservice.dto;

import com.example.userservice.model.UserPreferences;
import com.example.userservice.model.FavoriteGenre;
import com.example.userservice.model.FavoriteActor;
import com.example.userservice.model.FavoriteMovie;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class GetPreferencesDTO {
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private List<String> favoriteMovies;
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
        dto.setMinRating(preferences.getMinRating());
        return dto;
    }
}
