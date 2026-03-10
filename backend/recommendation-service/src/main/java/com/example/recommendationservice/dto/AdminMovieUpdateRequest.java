package com.example.recommendationservice.dto;

import lombok.Data;

@Data
public class AdminMovieUpdateRequest {

    private String title;
    private String category;
    private String posterUrl;
    private String genres;
    private String streamUrl;
    private String description;
    private Boolean active;
}

