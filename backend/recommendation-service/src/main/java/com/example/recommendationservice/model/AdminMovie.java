package com.example.recommendationservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "admin_movies")
@Data
public class AdminMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer tmdbId;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String category;

    @Column(columnDefinition = "TEXT")
    private String posterUrl;

    @Column(columnDefinition = "TEXT")
    private String genres;

    @Column(columnDefinition = "TEXT")
    private String streamUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean active = true;
}

