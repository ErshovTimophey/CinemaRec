package com.example.dto;

import java.util.List;

public class PreferencesEvent {
    private String email;
    private List<String> favoriteGenres;
    private List<String> favoriteActors;
    private List<String> favoriteMovies;
    private List<String> favoriteDirectors;
    private Double minRating;

    // Конструктор без аргументов
    public PreferencesEvent() {
    }

    // Конструктор со всеми аргументами
    public PreferencesEvent(String email, List<String> favoriteGenres, List<String> favoriteActors,
                            List<String> favoriteMovies, List<String> favoriteDirectors, Double minRating) {
        this.email = email;
        this.favoriteGenres = favoriteGenres;
        this.favoriteActors = favoriteActors;
        this.favoriteMovies = favoriteMovies;
        this.favoriteDirectors = favoriteDirectors;
        this.minRating = minRating;
    }

    // Геттеры и сеттеры
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public List<String> getFavoriteGenres() { return favoriteGenres; }
    public void setFavoriteGenres(List<String> favoriteGenres) { this.favoriteGenres = favoriteGenres; }
    public List<String> getFavoriteActors() { return favoriteActors; }
    public void setFavoriteActors(List<String> favoriteActors) { this.favoriteActors = favoriteActors; }
    public List<String> getFavoriteDirectors() { return favoriteDirectors; }
    public void setFavoriteDirectors(List<String> favoriteDirectors) { this.favoriteDirectors = favoriteDirectors; }
    public List<String> getFavoriteMovies() { return favoriteMovies; }
    public void setFavoriteMovies(List<String> favoriteMovies) { this.favoriteMovies = favoriteMovies; }
    public Double getMinRating() { return minRating; }
    public void setMinRating(Double minRating) { this.minRating = minRating; }
}