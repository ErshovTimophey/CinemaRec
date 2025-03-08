package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", unique = true)
    private String email;

    @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteGenre> favoriteGenres = new ArrayList<>();

    @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteActor> favoriteActors = new ArrayList<>();

    @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteMovie> favoriteMovies = new ArrayList<>();

    @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteDirector> favoriteDirectors = new ArrayList<>();

    private Double minRating;

    @UpdateTimestamp
    private LocalDateTime lastUpdated;
}
