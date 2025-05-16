package com.example.quizservice.controller;

import com.example.quizservice.dto.QuizDTO;
import com.example.quizservice.dto.QuizResultDTO;
import com.example.quizservice.service.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/quizzes")
public class QuizController {
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    @Autowired
    private QuizService quizService;

    @GetMapping
    public ResponseEntity<List<QuizDTO>> getAllQuizzes() {
        logger.info("Fetching all quizzes");
        return ResponseEntity.ok(quizService.getAllQuizzes());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<QuizDTO> createQuiz(
            @Valid @ModelAttribute QuizDTO quizDTO,
            @RequestParam("email") String email) {
        logger.info("Creating quiz by user: {}", email);
        QuizDTO createdQuiz = quizService.createQuiz(quizDTO, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdQuiz);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<QuizDTO> updateQuiz(
            @PathVariable("id") Long quizId,
            @Valid @ModelAttribute QuizDTO quizDTO,
            @RequestParam("email") String email) {
        logger.info("Updating quiz ID: {} by user: {}", quizId, email);
        try {
            QuizDTO updatedQuiz = quizService.updateQuiz(quizId, quizDTO, email);
            return ResponseEntity.ok(updatedQuiz);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PostMapping("/results")
    public ResponseEntity<QuizResultDTO> saveQuizResult(
            @Valid @RequestBody QuizResultDTO resultDTO,
            @RequestParam("email") String email) {
        logger.info("Saving quiz result for user: {}", email);
        logger.info("Result: {}", resultDTO.getScore());
        QuizResultDTO savedResult = quizService.saveQuizResult(resultDTO, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResult);
    }

    @GetMapping("/results")
    public ResponseEntity<List<QuizResultDTO>> getUserResults(
            @RequestParam("email") String email) {
        logger.info("Fetching quiz results for user: {}", email);
        return ResponseEntity.ok(quizService.getUserResults(email));
    }
}