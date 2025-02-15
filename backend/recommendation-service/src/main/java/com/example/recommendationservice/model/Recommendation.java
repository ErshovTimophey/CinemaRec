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

    private String email;
    private Integer movieId;
    private String movieTitle;
    private String posterUrl;
    private Double rating;
    private String overview;

    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;

    private boolean watched;

    @PrePersist
    protected void onCreate() {
        recommendedAt = LocalDateTime.now();
    }
}