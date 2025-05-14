package com.example.reviewservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Data
public class ReviewDTO {
    private Long id;
    @NotBlank(message = "Review text is required")
    private String userEmail;
    @NotBlank(message = "Movie title is required")
    private String movieTitle;
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 10, message = "Rating must be at most 10")
    private Integer rating;
    @NotBlank(message = "Review text is required")
    private String text;
    private List<MultipartFile> images = new ArrayList<>();
    private List<String> imageUrls = new ArrayList<>();
    private String createdAt;
}