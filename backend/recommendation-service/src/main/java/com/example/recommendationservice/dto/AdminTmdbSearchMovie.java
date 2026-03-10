package com.example.recommendationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminTmdbSearchMovie {

    private Integer tmdbId;
    private String title;
    private String overview;
    private String posterUrl;
    private String releaseDate;
}

