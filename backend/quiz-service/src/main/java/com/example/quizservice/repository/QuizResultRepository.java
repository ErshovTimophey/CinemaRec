package com.example.quizservice.repository;

import com.example.quizservice.model.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByUserEmail(String userEmail);

    List<QuizResult> findTop4ByUserEmailOrderByCompletedAtDesc(String userEmail);
}