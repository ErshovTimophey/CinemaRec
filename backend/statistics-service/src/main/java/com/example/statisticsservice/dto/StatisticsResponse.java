package com.example.statisticsservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatisticsResponse {
    private int totalWatched;
    private List<Distribution> genreDistribution;
    private List<Distribution> actorDistribution;
    private List<Distribution> directorDistribution;
    private List<Distribution> countryDistribution;
    private String preferencesAnalysis;

    @Data
    public static class Distribution {
        private String name;
        private String genre; // For genre distribution
        private String country; // For country distribution
        private int count;
    }
}