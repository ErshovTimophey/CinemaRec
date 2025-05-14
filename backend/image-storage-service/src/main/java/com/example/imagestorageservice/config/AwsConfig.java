package com.example.imagestorageservice.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AwsConfig {

    @Value("${aws.access-key}")
    private String accessKey;

    @Value("${aws.secret-key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.endpoint:#{null}}")
    private String s3Endpoint;

    @Bean
    public AmazonS3 amazonS3() {
        BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(credentials));

        if (s3Endpoint != null && !s3Endpoint.isEmpty()) {
            // Use custom endpoint for LocalStack
            builder.withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(s3Endpoint, region))
                    .withPathStyleAccessEnabled(true); // Required for LocalStack
        } else {
            // Use AWS region for production
            builder.withRegion(region);
        }

        return builder.build();
    }
}