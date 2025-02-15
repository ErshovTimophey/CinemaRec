package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class FavoriteActor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actor;

    @ManyToOne(fetch = FetchType.LAZY)
    private UserPreferences userPreferences;
}

