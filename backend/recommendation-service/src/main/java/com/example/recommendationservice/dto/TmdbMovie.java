package com.example.recommendationservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TmdbMovie {
    private Integer id;
    private String title;
    private String overview;

    @JsonProperty("poster_path")
    private String posterPath;

    @JsonProperty("vote_average")
    private Double voteAverage;

    @JsonProperty("genre_ids")
    private List<Integer> genreIds;

    private List<String> genreNames;

    private Integer voteCount;

    private Double popularity;

    private List<String> productionCountries = new ArrayList<>();

    @JsonProperty("release_date")
    private String releaseDate;
}