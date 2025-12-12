package com.example.statisticsservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@SpringBootApplication
public class StatisticsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(StatisticsServiceApplication.class, args);
	}
	
	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		// Configure timeout: 60 seconds for connection and read
		return builder
				.setConnectTimeout(Duration.ofSeconds(60))
				.setReadTimeout(Duration.ofSeconds(60))
				.build();
	}

}
