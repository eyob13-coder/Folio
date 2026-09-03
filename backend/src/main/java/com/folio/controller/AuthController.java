package com.folio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Authentication controller for JWT-based login and registration.
 * In production, integrate with Spring Security's UserDetailsService
 * and a proper JWT library (e.g., jjwt or nimbus-jose-jwt).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String displayName = request.getOrDefault("displayName", "User");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Email and password are required"));
        }

        // TODO: Implement actual user creation with BCrypt password hashing
        // UserEntity user = userService.createUser(email, password, displayName);

        String mockToken = generateMockToken(email);
        return ResponseEntity.ok(Map.of(
                "userId", UUID.randomUUID().toString(),
                "email", email,
                "displayName", displayName,
                "token", mockToken,
                "expiresAt", Instant.now().plusSeconds(86400).toString()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Email and password are required"));
        }

        // TODO: Validate credentials against database
        // UserEntity user = userService.authenticate(email, password);

        String mockToken = generateMockToken(email);
        return ResponseEntity.ok(Map.of(
                "userId", UUID.randomUUID().toString(),
                "email", email,
                "token", mockToken,
                "expiresAt", Instant.now().plusSeconds(86400).toString()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            @RequestHeader("Authorization") String authHeader) {
        // TODO: Validate existing token and issue a new one
        String newToken = UUID.randomUUID().toString();
        return ResponseEntity.ok(Map.of(
                "token", newToken,
                "expiresAt", Instant.now().plusSeconds(86400).toString()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        // TODO: Extract user from JWT token
        return ResponseEntity.ok(Map.of(
                "userId", UUID.randomUUID().toString(),
                "email", "user@folio.app",
                "displayName", "Folio User"
        ));
    }

    private String generateMockToken(String email) {
        // Placeholder — replace with actual JWT signing (HS256/RS256)
        return "folio_" + UUID.randomUUID().toString().replace("-", "");
    }
}
