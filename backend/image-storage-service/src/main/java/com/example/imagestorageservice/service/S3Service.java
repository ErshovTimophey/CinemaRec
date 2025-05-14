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

    public String uploadImage(MultipartFile image) {
        String fileName = UUID.randomUUID() + "-" + image.getOriginalFilename();
        File file = convertMultipartFileToFile(image);
        try {
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
            file.delete();
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