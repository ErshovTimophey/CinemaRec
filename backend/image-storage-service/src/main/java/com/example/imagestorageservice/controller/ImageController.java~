package com.example.imagestorageservice.controller;

import com.example.imagestorageservice.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {
    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);

    private final S3Service s3Service;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestPart("image") MultipartFile image) {
        logger.info("Received image upload request for file: "+ image.getName());
        String imageUrl = s3Service.uploadImage(image);
        return ResponseEntity.ok(imageUrl);
    }
}