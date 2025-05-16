package com.example.quizservice.service;

import com.example.quizservice.client.ImageStorageClient;
import com.example.quizservice.dto.QuestionDTO;
import com.example.quizservice.dto.QuizDTO;
import com.example.quizservice.dto.QuizResultDTO;
import com.example.quizservice.model.Quiz;
import com.example.quizservice.model.Question;
import com.example.quizservice.model.QuizResult;
import com.example.quizservice.repository.QuizRepository;
import com.example.quizservice.repository.QuizResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {
    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private ImageStorageClient imageStorageClient;

    public List<QuizDTO> getAllQuizzes() {
        logger.info("Fetching all quizzes");
        return quizRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizDTO createQuiz(QuizDTO quizDTO, String creatorEmail) {
        logger.info("Creating quiz: {} by {}", quizDTO.getTitle(), creatorEmail);
        Quiz quiz = new Quiz();
        quiz.setTitle(quizDTO.getTitle());
        quiz.setDescription(quizDTO.getDescription());
        quiz.setCreatorEmail(creatorEmail);

        List<Question> questions = quizDTO.getQuestions().stream().map(qDTO -> {
            Question question = new Question();
            question.setText(qDTO.getText());
            question.setAnswers(qDTO.getAnswers());
            question.setCorrectAnswer(qDTO.getCorrectAnswer());
            if (qDTO.getImage() != null && !qDTO.getImage().isEmpty()) {
                String imageUrl = imageStorageClient.uploadImage(qDTO.getImage());
                question.setImageUrl(imageUrl);
                qDTO.setImageUrl(imageUrl);
                logger.info("Uploaded question image: {}", imageUrl);
            }
            return question;
        }).collect(Collectors.toList());

        quiz.setQuestions(questions);
        Quiz savedQuiz = quizRepository.save(quiz);
        logger.info("Quiz created with ID: {}", savedQuiz.getId());
        return convertToDTO(savedQuiz);
    }

    @Transactional
    public QuizDTO updateQuiz(Long quizId, QuizDTO quizDTO, String userEmail) {
        logger.info("Updating quiz ID: {} by user: {}", quizId, userEmail);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        if (!quiz.getCreatorEmail().equals(userEmail)) {
            throw new IllegalArgumentException("Only the creator can edit this quiz");
        }

        quiz.setTitle(quizDTO.getTitle());
        quiz.setDescription(quizDTO.getDescription());

        // Update questions in place
        List<Question> existingQuestions = quiz.getQuestions();
        List<QuestionDTO> newQuestionDTOs = quizDTO.getQuestions();

        // Remove questions that are no longer in the DTO
        existingQuestions.removeIf(existingQuestion ->
                newQuestionDTOs.stream().noneMatch(dto ->
                        dto.getId() != null && dto.getId().equals(existingQuestion.getId())
                )
        );

        // Update or add questions
        for (QuestionDTO qDTO : newQuestionDTOs) {
            Question question;
            if (qDTO.getId() != null) {
                // Update existing question
                question = existingQuestions.stream()
                        .filter(q -> q.getId().equals(qDTO.getId()))
                        .findFirst()
                        .orElse(null);
                if (question == null) {
                    // If ID is provided but question not found, create new
                    question = new Question();
                    existingQuestions.add(question);
                }
            } else {
                // New question
                question = new Question();
                existingQuestions.add(question);
            }

            question.setText(qDTO.getText());
            question.setAnswers(qDTO.getAnswers());
            question.setCorrectAnswer(qDTO.getCorrectAnswer());
            if (qDTO.getImage() != null && !qDTO.getImage().isEmpty()) {
                String imageUrl = imageStorageClient.uploadImage(qDTO.getImage());
                question.setImageUrl(imageUrl);
                qDTO.setImageUrl(imageUrl);
                logger.info("Uploaded question image: {}", imageUrl);
            } else if (qDTO.getImageUrl() != null) {
                question.setImageUrl(qDTO.getImageUrl());
            } else {
                question.setImageUrl(null);
            }
        }

        Quiz updatedQuiz = quizRepository.save(quiz);
        logger.info("Quiz updated with ID: {}", updatedQuiz.getId());
        return convertToDTO(updatedQuiz);
    }

    @Transactional
    public QuizResultDTO saveQuizResult(QuizResultDTO resultDTO, String userEmail) {
        logger.info("Saving quiz result for quiz ID: {}, user: {}", resultDTO.getQuizId(), userEmail);
        List<QuizResult> existingResults = quizResultRepository.findByUserEmail(userEmail);
        if (existingResults.size() >= 4) {
            existingResults.sort((a, b) -> a.getCompletedAt().compareTo(b.getCompletedAt()));
            List<QuizResult> toDelete = existingResults.subList(0, existingResults.size() - 3);
            quizResultRepository.deleteAll(toDelete);
            logger.info("Deleted {} old quiz results for user: {}", toDelete.size(), userEmail);
        }

        QuizResult result = new QuizResult();
        result.setUserEmail(userEmail);
        result.setQuizId(resultDTO.getQuizId());
        result.setScore(resultDTO.getScore());
        result.setTotalQuestions(resultDTO.getTotalQuestions());
        result.setCompletedAt(LocalDateTime.now());

        QuizResult savedResult = quizResultRepository.save(result);
        logger.info("Quiz result saved with ID: {}", savedResult.getId());
        return convertToResultDTO(savedResult);
    }

    public List<QuizResultDTO> getUserResults(String userEmail) {
        logger.info("Fetching quiz results for user: {}", userEmail);
        return quizResultRepository.findTop4ByUserEmailOrderByCompletedAtDesc(userEmail).stream()
                .map(this::convertToResultDTO)
                .collect(Collectors.toList());
    }

    private QuizDTO convertToDTO(Quiz quiz) {
        QuizDTO dto = new QuizDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setCreatorEmail(quiz.getCreatorEmail());
        dto.setQuestions(quiz.getQuestions().stream().map(q -> {
            QuestionDTO qDTO = new QuestionDTO();
            qDTO.setId(q.getId());
            qDTO.setText(q.getText());
            qDTO.setImageUrl(q.getImageUrl());
            qDTO.setAnswers(q.getAnswers());
            qDTO.setCorrectAnswer(q.getCorrectAnswer());
            return qDTO;
        }).collect(Collectors.toList()));
        return dto;
    }

    private QuizResultDTO convertToResultDTO(QuizResult result) {
        QuizResultDTO dto = new QuizResultDTO();
        dto.setId(result.getId());
        dto.setUserEmail(result.getUserEmail());
        dto.setQuizId(result.getQuizId());
        dto.setScore(result.getScore());
        dto.setTotalQuestions(result.getTotalQuestions());
        dto.setCompletedAt(result.getCompletedAt());
        return dto;
    }
}