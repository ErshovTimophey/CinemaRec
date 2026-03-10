package com.example.playbackservice.controller;

import com.example.playbackservice.dto.MovieDetails;
import com.example.playbackservice.dto.MovieVideo;
import com.example.playbackservice.service.TmdbPlaybackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/playback")
@RequiredArgsConstructor
public class PlaybackController {

    private final TmdbPlaybackService tmdbPlaybackService;

    @GetMapping("/movies/{movieId}")
    public ResponseEntity<MovieDetails> getMovieDetails(
            @RequestParam(required = false) String email,
            @PathVariable Integer movieId) {
        MovieDetails details = tmdbPlaybackService.getMovieDetails(movieId);
        if (details.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }

    @GetMapping(value = "/movies/{movieId}/videos", produces = "application/json")
    public ResponseEntity<List<MovieVideo>> getMovieVideos(
            @RequestParam(required = false) String email,
            @PathVariable Integer movieId) {
        List<MovieVideo> videos = tmdbPlaybackService.getMovieVideos(movieId);
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/movies/{movieId}/poster")
    public ResponseEntity<byte[]> getMoviePoster(@PathVariable Long movieId) {
        byte[] poster = tmdbPlaybackService.getMoviePoster(movieId);
        if (poster == null || poster.length == 0) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(poster, headers, HttpStatus.OK);
    }
}
