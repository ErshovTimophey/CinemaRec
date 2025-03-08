package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class FavoriteDirector {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String director;

    @ManyToOne(fetch = FetchType.LAZY)
    private UserPreferences userPreferences;
}


