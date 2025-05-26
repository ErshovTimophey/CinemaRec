package com.example.statisticsservice.controller;


import com.example.statisticsservice.service.TmdbService;
import org.springframework.http.*;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tmdb")
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/movies/{movieId}/poster")
    public ResponseEntity<byte[]> getMoviePoster(@PathVariable Long movieId) {
        byte[] poster = tmdbService.getMoviePoster(movieId);
        if (poster == null || poster.length == 0) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(poster, headers, HttpStatus.OK);
    }

}
