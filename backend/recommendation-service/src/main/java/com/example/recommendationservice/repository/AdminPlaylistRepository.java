package com.example.recommendationservice.repository;

import com.example.recommendationservice.model.AdminPlaylist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminPlaylistRepository extends JpaRepository<AdminPlaylist, Long> {

    @EntityGraph(attributePaths = "movies")
    List<AdminPlaylist> findAll();
}

