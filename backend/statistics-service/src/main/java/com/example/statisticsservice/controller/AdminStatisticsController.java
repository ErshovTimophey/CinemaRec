package com.example.statisticsservice.controller;

import com.example.statisticsservice.dto.AdminStatisticsOverview;
import com.example.statisticsservice.repository.WatchedMovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final WatchedMovieRepository watchedMovieRepository;

    @GetMapping("/overview")
    public ResponseEntity<AdminStatisticsOverview> overview() {
        AdminStatisticsOverview dto = new AdminStatisticsOverview();
        dto.setTotalWatchedMovies(watchedMovieRepository.count());
        dto.setUniqueMovies(
                watchedMovieRepository.findAll()
                        .stream()
                        .map(w -> w.getMovieId())
                        .filter(id -> id != null)
                        .distinct()
                        .count()
        );
        return ResponseEntity.ok(dto);
    }
}

