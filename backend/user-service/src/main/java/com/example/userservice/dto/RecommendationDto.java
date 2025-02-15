package com.example.userservice.dto;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecommendationDto {
    private Long id;
    private String email;
    private Integer movieId;
    private String movieTitle;
    private String posterUrl;
    private Double rating;
    private String overview;
    private String genres;
    private LocalDateTime recommendedAt;

    private boolean watched;

    @PrePersist
    protected void onCreate() {
        recommendedAt = LocalDateTime.now();
    }
}