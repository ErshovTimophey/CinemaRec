package com.example.quizservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuizDTO {
    private Long id;
    private String title;
    private String description;
    private String creatorEmail;
    private List<QuestionDTO> questions;
    private boolean isPublic;
}