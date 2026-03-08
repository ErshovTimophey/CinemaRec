package com.example.imagestorageservice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.UUID;

@Service
public class S3Service {
    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);
    private final AmazonS3 s3Client;
    @Value("${aws.s3.bucket}")
    private String bucketName;

    public S3Service(AmazonS3 s3Client) {
        this.s3Client = s3Client;
    }

    public void deleteImage(String imageUrl) {
        try {
            logger.info("Deleting image from S3: {}", imageUrl);
            // Extract object key from URL (e.g., https://bucket.s3.amazonaws.com/key -> key)
            String objectKey = extractObjectKeyFromUrl(imageUrl);
            if (objectKey == null) {
                logger.error("Invalid image URL: {}", imageUrl);
                throw new RuntimeException("Invalid image URL: " + imageUrl);
            }

            // Check if object exists
            if (!s3Client.doesObjectExist(bucketName, objectKey)) {
                logger.warn("Image does not exist in S3: {}", objectKey);
                return; // No action needed if image doesn't exist
            }

            // Delete the object
            s3Client.deleteObject(bucketName, objectKey);
            logger.info("Image deleted successfully: {}", objectKey);
        } catch (Exception e) {
            logger.error("Failed to delete image from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete image from S3: " + imageUrl, e);
        }
    }

    private String extractObjectKeyFromUrl(String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            String path = url.getPath();
            // Remove leading '/' if present
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (Exception e) {
            logger.error("Failed to parse image URL: {}", imageUrl, e);
            return null;
        }
    }

    public String uploadImage(MultipartFile image) {
        try {
            return uploadImage(image.getBytes(), image.getOriginalFilename() != null ? image.getOriginalFilename() : "image");
        } catch (IOException e) {
            throw new RuntimeException("Failed to read multipart file", e);
        }
    }

    /** Used by gRPC and other callers that have raw bytes. */
    public String uploadImage(byte[] imageData, String originalFileName) {
        String fileName = UUID.randomUUID() + "-" + (originalFileName != null ? originalFileName : "image");
        File file = null;
        try {
            file = File.createTempFile("grpc-upload-", null);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(imageData);
            }
            logger.info("Uploading image to S3: {}", fileName);
            if (!s3Client.doesBucketExistV2(bucketName)) {
                logger.info("Bucket {} does not exist, creating it", bucketName);
                s3Client.createBucket(bucketName);
            }
            PutObjectRequest request = new PutObjectRequest(bucketName, fileName, file)
                    .withCannedAcl(CannedAccessControlList.PublicRead);
            s3Client.putObject(request);
            String url = s3Client.getUrl(bucketName, fileName).toString();
            logger.info("Image uploaded successfully: {}", url);
            return url;
        } catch (Exception e) {
            logger.error("Failed to upload image to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload image to S3", e);
        } finally {
            if (file != null) {
                file.delete();
            }
        }
    }

    private File convertMultipartFileToFile(MultipartFile file) {
        try {
            File convertedFile = new File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
            try (FileOutputStream fos = new FileOutputStream(convertedFile)) {
                fos.write(file.getBytes());
            }
            return convertedFile;
        } catch (IOException e) {
            throw new RuntimeException("Failed to convert multipart file to file", e);
        }
    }
}