package com.example.quizservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuizResultDTO {
    private Long id;
    private String userEmail;
    private Long quizId;
    private Integer score;
    private Integer totalQuestions;
    private LocalDateTime completedAt;
}