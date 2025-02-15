package com.example.userservice.recommendation;

import com.example.userservice.model.Movie;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "recommendation-service", url = "${feign.client.config.recommendation-service.url}")
public interface RecommendationClient {

    @GetMapping("/api/recommendations/{userId}")
    List<Movie> getRecommendations(@PathVariable String userId);
}