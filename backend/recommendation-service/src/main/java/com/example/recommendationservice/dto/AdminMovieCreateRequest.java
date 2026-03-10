package com.example.recommendationservice.dto;

import lombok.Data;

@Data
public class AdminMovieCreateRequest {

    private Integer tmdbId;

    private String title;

    /**
     * Optional admin-defined category/label for grouping in UI.
     */
    private String category;

    /**
     * Optional explicit poster URL. If not set, value from TMDB will be used.
     */
    private String overridePosterUrl;

    /**
     * Optional explicit genres string (comma-separated). If not set, value from TMDB will be used.
     */
    private String overrideGenres;

    /**
     * Optional streaming URL (e.g. Internet Archive embed or direct video URL).
     */
    private String streamUrl;
}

