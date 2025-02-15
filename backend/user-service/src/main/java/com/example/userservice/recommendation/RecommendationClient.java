package com.example.userservice.recommendation;

import com.example.userservice.dto.RecommendationDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "recommendation-service", url = "${feign.client.config.recommendation-service.url}")
public interface RecommendationClient {

    @GetMapping("/api/recommendations/{email}")
    List<RecommendationDto> getRecommendations(@PathVariable String email);
}