package com.example.quizservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuizResultDTO {
    private Long id;
    private String userEmail;
    private Long quizId;
    private int score;
    private int totalQuestions;
    private LocalDateTime completedAt;
}