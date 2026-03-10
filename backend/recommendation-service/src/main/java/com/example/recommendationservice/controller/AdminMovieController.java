package com.example.recommendationservice.controller;

import com.example.recommendationservice.dto.AdminMovieCreateRequest;
import com.example.recommendationservice.dto.AdminMovieUpdateRequest;
import com.example.recommendationservice.dto.AdminTmdbSearchMovie;
import com.example.recommendationservice.model.AdminMovie;
import com.example.recommendationservice.repository.AdminMovieRepository;
import com.example.recommendationservice.service.InternetArchiveService;
import com.example.recommendationservice.service.TmdbAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class AdminMovieController {

    private final AdminMovieRepository adminMovieRepository;
    private final TmdbAdminService tmdbAdminService;
    private final InternetArchiveService internetArchiveService;

    @GetMapping("/admin/movies")
    public ResponseEntity<List<AdminMovie>> list() {
        return ResponseEntity.ok(adminMovieRepository.findAll());
    }

    @GetMapping("/admin/movies/{id}")
    public ResponseEntity<AdminMovie> getById(@PathVariable Long id) {
        return adminMovieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/movies")
    public ResponseEntity<AdminMovie> create(@RequestBody AdminMovieCreateRequest req) {
        AdminMovie movie;
        if (req.getTmdbId() != null) {
            movie = tmdbAdminService.buildFromId(req.getTmdbId())
                    .orElseGet(AdminMovie::new);
            movie.setTmdbId(req.getTmdbId());
        } else {
            movie = new AdminMovie();
        }
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            movie.setTitle(req.getTitle());
        }
        if (req.getCategory() != null) {
            movie.setCategory(req.getCategory());
        }
        if (req.getOverridePosterUrl() != null && !req.getOverridePosterUrl().isBlank()) {
            movie.setPosterUrl(req.getOverridePosterUrl());
        }
        if (req.getOverrideGenres() != null) {
            movie.setGenres(req.getOverrideGenres());
        }
        if (req.getStreamUrl() != null) {
            movie.setStreamUrl(req.getStreamUrl());
        }
        movie.setActive(true);
        AdminMovie saved = adminMovieRepository.save(movie);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/admin/movies/{id}")
    public ResponseEntity<AdminMovie> update(@PathVariable Long id, @RequestBody AdminMovieUpdateRequest req) {
        return adminMovieRepository.findById(id)
                .map(m -> {
                    if (req.getTitle() != null) m.setTitle(req.getTitle());
                    if (req.getCategory() != null) m.setCategory(req.getCategory());
                    if (req.getPosterUrl() != null) m.setPosterUrl(req.getPosterUrl());
                    if (req.getGenres() != null) m.setGenres(req.getGenres());
                    if (req.getStreamUrl() != null) m.setStreamUrl(req.getStreamUrl());
                    if (req.getDescription() != null) m.setDescription(req.getDescription());
                    if (req.getActive() != null) m.setActive(req.getActive());
                    return ResponseEntity.ok(adminMovieRepository.save(m));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/movies/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!adminMovieRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        adminMovieRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/movies")
    public ResponseEntity<List<AdminMovie>> publicList() {
        List<AdminMovie> list = adminMovieRepository.findAll()
                .stream()
                .filter(AdminMovie::isActive)
                .toList();
        for (AdminMovie m : list) {
            if ((m.getPosterUrl() == null || m.getPosterUrl().isBlank()) && m.getTmdbId() != null) {
                m.setPosterUrl(tmdbAdminService.getPosterUrl(m.getTmdbId()));
            }
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<AdminMovie> getMovie(@PathVariable Long id) {
        return adminMovieRepository.findById(id)
                .filter(AdminMovie::isActive)
                .map(m -> {
                    if ((m.getPosterUrl() == null || m.getPosterUrl().isBlank()) && m.getTmdbId() != null) {
                        m.setPosterUrl(tmdbAdminService.getPosterUrl(m.getTmdbId()));
                    }
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/movies/{id}/poster")
    public ResponseEntity<Void> getMoviePoster(@PathVariable Long id) {
        var movieOpt = adminMovieRepository.findById(id).filter(AdminMovie::isActive);
        if (movieOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AdminMovie m = movieOpt.get();
        String url = null;
        if (m.getPosterUrl() != null && !m.getPosterUrl().isBlank()) {
            url = m.getPosterUrl();
        } else if (m.getTmdbId() != null) {
            url = tmdbAdminService.getPosterUrl(m.getTmdbId());
        }
        if (url == null) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LOCATION, url);
        return ResponseEntity.status(HttpStatus.FOUND).headers(headers).build();
    }

    @GetMapping("/admin/archive/search")
    public ResponseEntity<List<InternetArchiveService.ArchiveMovieOption>> searchArchiveMovies(
            @RequestParam("query") String query,
            @RequestParam(value = "rows", defaultValue = "10") int rows
    ) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(internetArchiveService.searchMovies(query, rows));
    }

    @GetMapping("/admin/movies/tmdb-search")
    public ResponseEntity<List<AdminTmdbSearchMovie>> searchTmdbMovies(
            @RequestParam("query") String query
    ) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(tmdbAdminService.searchMovies(query));
    }
}
