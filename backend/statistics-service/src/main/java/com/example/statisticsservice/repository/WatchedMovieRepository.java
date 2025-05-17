package com.example.statisticsservice.repository;

import com.example.statisticsservice.model.WatchedMovie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchedMovieRepository extends JpaRepository<WatchedMovie, Long> {
    List<WatchedMovie> findByEmail(String email);
    Optional<WatchedMovie> findByEmailAndMovieId(String email, Integer movieId);
    void deleteByEmailAndMovieId(String email, Integer movieId);
}