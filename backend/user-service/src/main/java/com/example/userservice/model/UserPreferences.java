package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", unique = true)
    private String email;

    @ElementCollection
    private List<String> favoriteGenres;

    @ElementCollection
    private List<String> favoriteActors;

    private Double minRating;

    @UpdateTimestamp
    private LocalDateTime lastUpdated;
}
