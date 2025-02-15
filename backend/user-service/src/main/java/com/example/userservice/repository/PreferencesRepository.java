package com.example.userservice.repository;

import com.example.userservice.model.UserPreferences;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreferencesRepository extends JpaRepository<UserPreferences, Long> {
    Optional<UserPreferences> findByEmail(String email);
}