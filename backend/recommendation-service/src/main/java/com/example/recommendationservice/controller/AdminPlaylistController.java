package com.example.recommendationservice.controller;

import com.example.recommendationservice.model.AdminMovie;
import com.example.recommendationservice.model.AdminPlaylist;
import com.example.recommendationservice.repository.AdminMovieRepository;
import com.example.recommendationservice.repository.AdminPlaylistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/playlists")
@RequiredArgsConstructor
public class AdminPlaylistController {

    private final AdminPlaylistRepository playlistRepository;
    private final AdminMovieRepository adminMovieRepository;

    @GetMapping
    public ResponseEntity<List<AdminPlaylist>> list() {
        return ResponseEntity.ok(playlistRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<AdminPlaylist> create(@RequestBody AdminPlaylist dto) {
        AdminPlaylist saved = playlistRepository.save(dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminPlaylist> update(@PathVariable Long id, @RequestBody AdminPlaylist dto) {
        return playlistRepository.findById(id)
                .map(existing -> {
                    existing.setName(dto.getName());
                    existing.setDescription(dto.getDescription());
                    existing.setActive(dto.isActive());
                    return ResponseEntity.ok(playlistRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        playlistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/movies/{movieId}")
    public ResponseEntity<AdminPlaylist> addMovie(
            @PathVariable Long id,
            @PathVariable Long movieId
    ) {
        AdminPlaylist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        AdminMovie movie = adminMovieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));
        if (!playlist.getMovies().contains(movie)) {
            playlist.getMovies().add(movie);
        }
        return ResponseEntity.ok(playlistRepository.save(playlist));
    }

    @DeleteMapping("/{id}/movies/{movieId}")
    public ResponseEntity<AdminPlaylist> removeMovie(
            @PathVariable Long id,
            @PathVariable Long movieId
    ) {
        AdminPlaylist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        playlist.getMovies().removeIf(m -> m.getId().equals(movieId));
        return ResponseEntity.ok(playlistRepository.save(playlist));
    }
}

