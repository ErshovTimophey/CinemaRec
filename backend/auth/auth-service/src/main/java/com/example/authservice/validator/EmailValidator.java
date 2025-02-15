package com.example.authservice.validator;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class EmailValidator {

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";

    public boolean isValid(String email) {
        return Pattern.compile(EMAIL_REGEX)
                .matcher(email)
                .matches();
    }
}
