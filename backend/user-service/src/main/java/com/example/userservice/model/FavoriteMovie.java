package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class FavoriteMovie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String movie;

    @ManyToOne(fetch = FetchType.LAZY)
    private UserPreferences userPreferences;
}


