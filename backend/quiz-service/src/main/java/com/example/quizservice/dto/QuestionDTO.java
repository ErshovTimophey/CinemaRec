package com.example.quizservice.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class QuestionDTO {
    private Long id;
    private String text;
    private MultipartFile image;
    private String imageUrl;
    private String[] answers = new String[4];
    private int correctAnswer;
}