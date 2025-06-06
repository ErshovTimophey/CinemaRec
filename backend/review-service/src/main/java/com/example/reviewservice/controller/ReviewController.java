package com.example.reviewservice.controller;

import com.example.reviewservice.dto.ReviewDTO;
import com.example.reviewservice.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
    private static final Logger logger = LoggerFactory.getLogger(ReviewController.class);

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<ReviewDTO>> getAllReviews() {
        logger.info("Fetching all reviews");
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@Valid @ModelAttribute ReviewDTO reviewDTO, @RequestParam("email") String email) {
        logger.info("Creating review for movie: {}", reviewDTO.getMovieTitle());
        if (!email.equals(reviewDTO.getUserEmail())) {
            logger.warn("Email {} attempted to create review with email {}", email, reviewDTO.getUserEmail());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        ReviewDTO createdReview = reviewService.createReview(reviewDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReview);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable String id,
            @Valid @ModelAttribute ReviewDTO reviewDTO,
            @RequestParam("email") String email,
            @RequestParam(value = "deletedImageUrls", required = false) String deletedImageUrlsJson
    ) {
        logger.info("Updating review with ID: {}", id);
        if (!reviewService.isReviewOwner(Long.valueOf(id), email)) {
            logger.warn("Email {} attempted to update review {} they do not own", email, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            if (deletedImageUrlsJson != null && !deletedImageUrlsJson.isEmpty()) {
                logger.info("Deleted image URLs: {}", deletedImageUrlsJson);
                List<String> deletedImageUrls = objectMapper.readValue(deletedImageUrlsJson, List.class);
                reviewDTO.setDeletedImageUrls(deletedImageUrls);
            }
        } catch (Exception e) {
            logger.error("Error parsing deletedImageUrls: {}", deletedImageUrlsJson, e);
            return ResponseEntity.badRequest().build();
        }
        ReviewDTO updatedReview = reviewService.updateReview(Long.valueOf(id), reviewDTO);
        return ResponseEntity.ok(updatedReview);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable String id, @RequestParam("email") String email) {
        logger.info("Deleting review with ID: {}", id);
        if (!reviewService.isReviewOwner(Long.valueOf(id), email)) {
            logger.warn("Email {} attempted to delete review {} they do not own", email, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        reviewService.deleteReview(Long.valueOf(id));
        return ResponseEntity.noContent().build();
    }
}