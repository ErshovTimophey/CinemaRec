package com.example.recommendationservice.model;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "recommendations")
@JsonTypeName("Recommendation")
@JsonTypeInfo(include = JsonTypeInfo.As.PROPERTY, use = JsonTypeInfo.Id.NAME)
public class Recommendation implements Serializable {
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