package com.example.imagestorageservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class ImageStorageServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ImageStorageServiceApplication.class, args);
	}

}
