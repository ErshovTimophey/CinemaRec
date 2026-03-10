package com.example.recommendationservice.repository;

import com.example.recommendationservice.model.AdminMovie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminMovieRepository extends JpaRepository<AdminMovie, Long> {
}

