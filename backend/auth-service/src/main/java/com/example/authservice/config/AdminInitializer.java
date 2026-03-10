package com.example.authservice.config;

import com.example.authservice.entity.OAuth2Provider;
import com.example.authservice.entity.User;
import com.example.authservice.entity.UserRole;
import com.example.authservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@cinemarec.local";
            if (userRepository.existsByEmail(adminEmail)) {
                return;
            }
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("Admin123!"));
            admin.setRole(UserRole.ADMIN);
            admin.setProvider(OAuth2Provider.LOCAL);
            userRepository.save(admin);
        };
    }
}

