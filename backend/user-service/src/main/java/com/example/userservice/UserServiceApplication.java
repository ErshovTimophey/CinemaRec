package com.example.userservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.example.userservice.recommendation")
public class UserServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
	}
	
	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		// Configure timeout: 60 seconds for connection and read
		// This fixes TMDB API timeout issues
		return builder
				.setConnectTimeout(Duration.ofSeconds(60))
				.setReadTimeout(Duration.ofSeconds(60))
				.build();
	}

}
