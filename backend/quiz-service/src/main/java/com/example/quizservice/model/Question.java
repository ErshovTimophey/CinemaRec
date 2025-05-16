package com.example.quizservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;
    private String imageUrl;

    @ElementCollection
    private String[] answers = new String[4]; // Exactly 4 answers

    private int correctAnswer; // Index of correct answer (0-3)

}