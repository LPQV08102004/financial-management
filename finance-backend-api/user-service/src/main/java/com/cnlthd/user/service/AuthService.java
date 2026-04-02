package com.cnlthd.user.service;

import com.cnlthd.user.dto.request.LoginRequest;
import com.cnlthd.user.dto.request.SignupRequest;
import com.cnlthd.user.dto.response.LoginResponse;
import com.cnlthd.user.dto.response.UserDto;
import com.cnlthd.user.entity.User;
import com.cnlthd.user.exception.InvalidCredentialsException;
import com.cnlthd.user.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@Slf4j
public class AuthService {

  private final UserService userService;
  private final JwtTokenProvider jwtTokenProvider;

  public AuthService(UserService userService, JwtTokenProvider jwtTokenProvider) {
    this.userService = userService;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  public UserDto signup(SignupRequest request) {
    log.info("User signup request for email: {}", request.getEmail());
    return userService.signup(request);
  }

  public LoginResponse login(LoginRequest request) {
    log.info("User login request for email: {}", request.getEmail());
    
    // Get user by email
    User user = userService.getUserByEmail(request.getEmail());

    // Check if user is active
    if (!user.getIsActive()) {
      throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa");
    }

    // Validate password
    if (!userService.validatePassword(request.getEmail(), request.getPassword())) {
      throw new InvalidCredentialsException("Email hoặc mật khẩu không chính xác");
    }

    // Update last login time
    user.setLastLoginAt(LocalDateTime.now());

    // Generate tokens
    String accessToken = jwtTokenProvider.generateAccessToken(
        user.getId(),
        user.getEmail(),
        user.getRole().getValue()
    );

    String refreshToken = jwtTokenProvider.generateRefreshToken(
        user.getId(),
        user.getEmail(),
        user.getRole().getValue()
    );

    log.info("User logged in successfully: {}", user.getId());

    return LoginResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .user(UserDto.fromEntity(user))
        .build();
  }

  public void logout(String userId) {
    log.info("User logout: {}", userId);
    // In a real application, you might want to blacklist the token or revoke it
  }

  public LoginResponse refreshToken(String refreshToken) {
    log.info("Refresh token request");
    
    // Validate refresh token
    if (!jwtTokenProvider.validateToken(refreshToken)) {
      throw new InvalidCredentialsException("Invalid refresh token");
    }

    // Get user info from token
    String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
    String email = jwtTokenProvider.getEmailFromToken(refreshToken);
    String role = jwtTokenProvider.getRoleFromToken(refreshToken);

    // Get user details
    User user = userService.getUserById(userId);

    // Generate new tokens
    String newAccessToken = jwtTokenProvider.generateAccessToken(userId, email, role);
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId, email, role);

    return LoginResponse.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .user(UserDto.fromEntity(user))
        .build();
  }
}
