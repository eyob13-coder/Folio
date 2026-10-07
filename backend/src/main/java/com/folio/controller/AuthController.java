package com.folio.controller;

import com.folio.service.AuthService;
import com.folio.service.AuthService.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Production authentication endpoints — register, login, refresh, and profile.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String displayName = body.getOrDefault("displayName", null);

        if (email == null || password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Email and password (min 6 chars) are required"));
        }

        try {
            AuthResponse res = authService.register(email, password, displayName);
            return ResponseEntity.ok(toMap(res));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Email and password are required"));
        }

        try {
            AuthResponse res = authService.login(email, password);
            return ResponseEntity.ok(toMap(res));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        AuthResponse res = authService.refreshToken(userId);
        return ResponseEntity.ok(toMap(res));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return authService.findById(userId)
                .map(u -> ResponseEntity.ok(Map.of(
                        "userId", u.getId(),
                        "email", u.getEmail(),
                        "displayName", u.getDisplayName() != null ? u.getDisplayName() : "",
                        "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(AuthResponse r) {
        return Map.of(
                "userId", r.userId(),
                "email", r.email(),
                "displayName", r.displayName() != null ? r.displayName() : "",
                "token", r.token(),
                "expiresAt", r.expiresAt().toString()
        );
    }
}
