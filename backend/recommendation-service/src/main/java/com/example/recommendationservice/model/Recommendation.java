package com.example.recommendationservice.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "recommendations")
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String email;
    private Integer movieId;
    @Column(columnDefinition = "TEXT")
    private String movieTitle;
    @Column(columnDefinition = "TEXT")
    private String posterUrl;
    private Double rating;
    @Column(columnDefinition = "TEXT")
    private String overview;
    @Column(columnDefinition = "TEXT")
    private String genres;

    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;

    private boolean watched;

    @Column(nullable = false)
    private String category;

    @PrePersist
    protected void onCreate() {
        recommendedAt = LocalDateTime.now();
    }
}