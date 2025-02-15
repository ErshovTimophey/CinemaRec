package com.example.userservice.controller;

import com.example.userservice.model.Movie;
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
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        System.out.println(id + " АЙДИ");
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/{email}/recommendations")
    public ResponseEntity<List<Movie>> getRecommendations(@PathVariable String userId) {
        System.out.println(userId + " ЮЗЕР АЙДИ");
        return ResponseEntity.ok(userService.getUserRecommendations(userId));
    }
}
