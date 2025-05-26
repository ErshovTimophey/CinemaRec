package com.example.recommendationservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TmdbMovieDTO {
    private Integer id;
    private String title;
    private String overview;
    @JsonProperty("poster_path")
    private String posterPath;
    @JsonProperty("vote_average")
    private Double voteAverage;
    @JsonProperty("vote_count")
    private Integer voteCount;
    private Double popularity;
    @JsonProperty("genre_ids")
    private List<Integer> genreIds = new ArrayList<>();
    private List<String> genreNames = new ArrayList<>();
    private List<String> productionCountries = new ArrayList<>();
    @JsonProperty("release_date")
    private String releaseDate;
}