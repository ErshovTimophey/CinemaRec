package com.example.recommendationservice.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admin_playlists")
@Data
public class AdminPlaylist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean active = true;

    @ManyToMany
    @JoinTable(
            name = "admin_playlist_movies",
            joinColumns = @JoinColumn(name = "playlist_id"),
            inverseJoinColumns = @JoinColumn(name = "admin_movie_id")
    )
    private List<AdminMovie> movies = new ArrayList<>();
}

