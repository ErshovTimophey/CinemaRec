package com.example.recommendationservice.dto;

import lombok.Data;

@Data
public class RecommendationDTO {
    private Integer movieId;
    private String movieTitle;
    private String posterUrl;
    private Double rating;
    private String overview;
    private String genres;
    private boolean watched;
    private String category;
}