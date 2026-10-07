package com.folio.service;

import com.folio.entity.UserEntity;
import com.folio.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * Handles user registration, authentication, and profile retrieval.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record AuthResponse(String userId, String email, String displayName,
                                String avatarUrl, String token, Instant expiresAt) {}

    public AuthResponse register(String email, String password, String displayName) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email.toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName != null ? displayName : email.split("@")[0]);
        user.setLastLoginAt(Instant.now());
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        Instant expiresAt = Instant.now().plusSeconds(86400);

        return new AuthResponse(user.getId(), user.getEmail(),
                user.getDisplayName(), user.getAvatarUrl(), token, expiresAt);
    }

    public AuthResponse login(String email, String password) {
        UserEntity user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        Instant expiresAt = Instant.now().plusSeconds(86400);

        return new AuthResponse(user.getId(), user.getEmail(),
                user.getDisplayName(), user.getAvatarUrl(), token, expiresAt);
    }

    public Optional<UserEntity> findById(String userId) {
        return userRepository.findById(userId);
    }

    public AuthResponse refreshToken(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        Instant expiresAt = Instant.now().plusSeconds(86400);

        return new AuthResponse(user.getId(), user.getEmail(),
                user.getDisplayName(), user.getAvatarUrl(), token, expiresAt);
    }
}
