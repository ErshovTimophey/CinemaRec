package com.example.authservice.oauth;

import com.example.authservice.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User oauthUser = (CustomOAuth2User) authentication.getPrincipal();

        String token = jwtUtil.generateToken(oauthUser.getEmail(), oauthUser.getRole());

        // Перенаправляем с токеном и информацией о пользователе
        response.sendRedirect("http://localhost:3000/oauth2/redirect?token=" + token
                + "&email=" + URLEncoder.encode(oauthUser.getEmail(), "UTF-8")
                + "&role=" + oauthUser.getRole());
    }
}