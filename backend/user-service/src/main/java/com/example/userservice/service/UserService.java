package com.example.userservice.service;

import com.example.userservice.model.Movie;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.userservice.recommendation.RecommendationClient;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    @Autowired
    private final RecommendationClient recommendationClient;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<Movie> getUserRecommendations(String userId) {
        return recommendationClient.getRecommendations(userId);
    }
}