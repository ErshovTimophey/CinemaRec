package com.example.statisticsservice.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MovieDetails {
    private Integer id;
    private String title;
    private String overview;
    private String posterPath;
    private Double voteAverage;
    private String releaseDate;
    private Integer runtime;
    private List<String> genres = new ArrayList<>();
    private List<String> actors = new ArrayList<>();
    private List<String> directors = new ArrayList<>();
    private String country;
}