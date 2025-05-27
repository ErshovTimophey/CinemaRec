package com.example.authservice.dto;

import lombok.Data;

@Data
public class UserDto {
    private String email;
    private String password;
    private String role;
}