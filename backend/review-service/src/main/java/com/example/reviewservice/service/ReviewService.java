package com.example.reviewservice.service;

import com.example.reviewservice.client.ImageStorageClient;
import com.example.reviewservice.dto.ReviewDTO;
import com.example.reviewservice.model.Review;
import com.example.reviewservice.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ImageStorageClient imageStorageClient;

    public List<ReviewDTO> getAllReviews() {
        logger.info("Fetching all reviews from repository");
        return reviewRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        logger.info("Creating review for movie: {}", reviewDTO.getMovieTitle());
        Review review = new Review();
        review.setMovieTitle(reviewDTO.getMovieTitle());
        review.setRating(reviewDTO.getRating());
        review.setText(reviewDTO.getText());
        review.setUserEmail(reviewDTO.getUserEmail());

        if (!reviewDTO.getImages().isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile image : reviewDTO.getImages()) {
                if (!image.isEmpty()) {
                    String imageUrl = imageStorageClient.uploadImage(image);
                    imageUrls.add(imageUrl);
                    logger.info("Uploaded image: {}", imageUrl);
                }
            }
            review.setImageUrls(imageUrls);
        }

        Review savedReview = reviewRepository.save(review);
        logger.info("Review created with ID: {}", savedReview.getId());
        return convertToDTO(savedReview);
    }

    @Transactional
    public ReviewDTO updateReview(Long id, ReviewDTO reviewDTO) {
        logger.info("Updating review with ID: {}", id);
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with ID: " + id));

        review.setMovieTitle(reviewDTO.getMovieTitle());
        review.setRating(reviewDTO.getRating());
        review.setText(reviewDTO.getText());

        // Start with existing image URLs
        List<String> imageUrls = new ArrayList<>(review.getImageUrls());

        // Remove images marked for deletion
        if (reviewDTO.getDeletedImageUrls() != null && !reviewDTO.getDeletedImageUrls().isEmpty()) {
            for (String deletedUrl : reviewDTO.getDeletedImageUrls()) {
                imageUrls.remove(deletedUrl);
                logger.info("Removed image URL: {}", deletedUrl);
                // Optionally, notify ImageStorageClient to delete the image
                imageStorageClient.deleteImage(deletedUrl);
            }
        }

        // Add new images
        if (!reviewDTO.getImages().isEmpty()) {
            for (MultipartFile image : reviewDTO.getImages()) {
                if (!image.isEmpty()) {
                    String imageUrl = imageStorageClient.uploadImage(image);
                    imageUrls.add(imageUrl);
                    logger.info("Uploaded new image: {}", imageUrl);
                }
            }
        }

        review.setImageUrls(imageUrls);
        Review updatedReview = reviewRepository.save(review);
        logger.info("Review updated with ID: {}", updatedReview.getId());
        return convertToDTO(updatedReview);
    }

    @Transactional
    public void deleteReview(Long id) {
        logger.info("Deleting review with ID: {}", id);
        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException("Review not found with ID: " + id);
        }
        reviewRepository.deleteById(id);
        logger.info("Review deleted with ID: {}", id);
    }

    public boolean isReviewOwner(Long id, String userEmail) {
        return reviewRepository.findById(id)
                .map(review -> review.getUserEmail().equals(userEmail))
                .orElse(false);
    }

    private ReviewDTO convertToDTO(Review review) {
        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setMovieTitle(review.getMovieTitle());
        reviewDTO.setRating(review.getRating());
        reviewDTO.setText(review.getText());
        reviewDTO.setUserEmail(review.getUserEmail());
        reviewDTO.setImageUrls(review.getImageUrls());
        reviewDTO.setId(review.getId());
        return reviewDTO;
    }
}