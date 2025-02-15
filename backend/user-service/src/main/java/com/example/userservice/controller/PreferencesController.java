package com.example.userservice.controller;

import com.example.userservice.dto.GetPreferencesDTO;
import com.example.userservice.dto.PreferencesDTO;
import com.example.userservice.model.UserPreferences;
import com.example.userservice.service.PreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/{email}/preferences")
@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:3000")
public class PreferencesController {

    private final PreferencesService preferencesService;

    @PutMapping
    public ResponseEntity<UserPreferences> updatePreferences(
            @PathVariable String email,
            @RequestBody PreferencesDTO dto) {
        return ResponseEntity.ok(preferencesService.updatePreferences(email, dto));
    }

//    @GetMapping
//    public ResponseEntity<UserPreferences> getPreferences(@PathVariable String email) {
//        System.out.println(email + " Юзер айди");
//        return ResponseEntity.ok(preferencesService.getPreferences(email));
//    }

    @GetMapping
    public ResponseEntity<?> getPreferences(@PathVariable String email) {
        try {
            UserPreferences preferences = preferencesService.getPreferences(email);
            return ResponseEntity.ok(GetPreferencesDTO.fromEntity(preferences));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
