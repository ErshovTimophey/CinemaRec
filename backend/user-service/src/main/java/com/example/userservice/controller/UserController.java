package com.example.userservice.controller;

import com.example.dto.PreferencesEvent;
import com.example.userservice.dto.GetPreferencesDTO;
import com.example.userservice.dto.RecommendationDto;
import com.example.userservice.model.User;
import com.example.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable String email) {
        System.out.println(email+ " АЙДИ");
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/{email}/recommendations")
    public ResponseEntity<List<RecommendationDto>> getRecommendations(@PathVariable String email) {
        System.out.println(email + " ЮЗЕР АЙДИ");
        return ResponseEntity.ok(userService.getUserRecommendations(email));
    }

    @PostMapping("/{email}/refresh-recommendations")
    public ResponseEntity<Void> refreshRecommendations(@PathVariable String email) {
        userService.refreshRecommendations(email);
        return ResponseEntity.ok().build();
    }

    /*@PostMapping("/recommendations/{movieId}/watched")
    public ResponseEntity<Void> markMovieAsWatched(@PathVariable String email, @PathVariable Integer movieId) {
        recommendationService.markMovieAsWatched(email, movieId);
        return ResponseEntity.ok().build();
    }*/


}
