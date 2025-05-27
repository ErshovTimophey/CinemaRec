package com.example.authservice.service;

import com.example.authservice.dto.AuthRequest;
import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.UserDto;
import com.example.authservice.entity.OAuth2Provider;
import com.example.authservice.entity.User;
import com.example.authservice.entity.UserRole;
import com.example.authservice.exception.AuthException;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.util.JwtUtil;
import com.example.authservice.validator.EmailValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailValidator emailValidator;

    public AuthResponse register(UserDto userDto) {
        if (!emailValidator.isValid(userDto.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setRole(UserRole.valueOf("USER"));
        user.setProvider(OAuth2Provider.LOCAL);

        userRepository.save(user);

        return new AuthResponse(jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
    }

    public AuthResponse login(AuthRequest authRequest) {
        User user = userRepository.findByEmail(authRequest.getEmail())
                .orElseThrow(() -> new AuthException("User not found"));
        String encodedPassword = passwordEncoder.encode(authRequest.getPassword());
        if (!encodedPassword.equals(user.getPassword())) {
            String token = jwtUtil.generateToken(user.getEmail(), String.valueOf(user.getRole()));
            return new AuthResponse(token);
        }
        throw new AuthException("Invalid credentials"+ authRequest.getPassword() +" "+ user.getPassword());
    }

    public AuthResponse googleLogin(AuthRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(request.getEmail());
                        newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                        newUser.setRole(UserRole.USER);
                        newUser.setProvider(OAuth2Provider.GOOGLE);
                        return userRepository.save(newUser);
                    });

            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            AuthResponse authResponse = new AuthResponse();
            authResponse.setToken(token);

            return new AuthResponse(token);
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed", e);
        }
    }
}