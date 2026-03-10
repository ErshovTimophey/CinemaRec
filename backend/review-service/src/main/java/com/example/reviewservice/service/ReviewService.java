package com.example.reviewservice.service;

import com.example.cinemarec.grpc.imagestorage.DeleteImageRequest;
import com.example.cinemarec.grpc.imagestorage.ImageStorageServiceGrpc;
import com.example.cinemarec.grpc.imagestorage.UploadImageRequest;
import com.example.reviewservice.dto.ReviewDTO;
import com.example.reviewservice.model.Review;
import com.example.reviewservice.repository.ReviewRepository;
import com.google.protobuf.ByteString;
import io.grpc.StatusRuntimeException;
import net.devh.boot.grpc.client.inject.GrpcClient;
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

    @GrpcClient("image-storage-service")
    private ImageStorageServiceGrpc.ImageStorageServiceBlockingStub imageStorageStub;

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
                    String imageUrl = uploadImageViaGrpc(image);
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
                deleteImageViaGrpc(deletedUrl);
            }
        }

        // Add new images
        if (!reviewDTO.getImages().isEmpty()) {
            for (MultipartFile image : reviewDTO.getImages()) {
                if (!image.isEmpty()) {
                    String imageUrl = uploadImageViaGrpc(image);
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

    private String uploadImageViaGrpc(MultipartFile image) {
        try {
            return imageStorageStub.uploadImage(UploadImageRequest.newBuilder()
                    .setImageData(ByteString.copyFrom(image.getBytes()))
                    .setFileName(image.getOriginalFilename() != null ? image.getOriginalFilename() : "image")
                    .build()).getImageUrl();
        } catch (Exception e) {
            throw new RuntimeException("gRPC image-storage upload failed", e);
        }
    }

    private void deleteImageViaGrpc(String imageUrl) {
        try {
            imageStorageStub.deleteImage(DeleteImageRequest.newBuilder().setImageUrl(imageUrl).build());
        } catch (StatusRuntimeException e) {
            logger.warn("gRPC image-storage delete failed for {}: {}", imageUrl, e.getStatus());
        }
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