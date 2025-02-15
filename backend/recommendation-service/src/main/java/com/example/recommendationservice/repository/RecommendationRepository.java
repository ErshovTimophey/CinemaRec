package com.example.recommendationservice.repository;

import com.example.recommendationservice.model.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByEmail(String email);
    Optional<Recommendation> findByEmailAndMovieId(String email, Integer movieId);

    void deleteByEmail(String email);
}