package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class FavoriteGenre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String genre;

    @ManyToOne(fetch = FetchType.LAZY)
    private UserPreferences userPreferences;
}

