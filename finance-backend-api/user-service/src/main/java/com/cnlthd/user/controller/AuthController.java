package com.cnlthd.user.controller;

import com.cnlthd.user.dto.request.LoginRequest;
import com.cnlthd.user.dto.request.SignupRequest;
import com.cnlthd.user.dto.response.ApiResponse;
import com.cnlthd.user.dto.response.LoginResponse;
import com.cnlthd.user.dto.response.UserDto;
import com.cnlthd.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/signup")
  public ResponseEntity<ApiResponse<UserDto>> signup(@Valid @RequestBody SignupRequest request) {
    log.info("Signup request for email: {}", request.getEmail());
    UserDto userDto = authService.signup(request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản", userDto));
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
    log.info("Login request for email: {}", request.getEmail());
    LoginResponse response = authService.login(request);
    return ResponseEntity
        .ok(ApiResponse.success("Đăng nhập thành công", response));
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout() {
    log.info("Logout request");

    String userId = (String) org.springframework.security.core.context.SecurityContextHolder
        .getContext().getAuthentication().getPrincipal();
    authService.logout(userId);
    return ResponseEntity
        .ok(ApiResponse.success("Đăng xuất thành công"));
  }

  @PostMapping("/refresh-token")
  public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
      @RequestHeader("Authorization") String authHeader) {
    log.info("Refresh token request");

    String refreshToken = authHeader.replace("Bearer ", "");
    LoginResponse response = authService.refreshToken(refreshToken);

    return ResponseEntity
        .ok(ApiResponse.success("Token làm mới thành công", response));
  }

  @PostMapping("/verify-email")
  public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
    log.info("Email verification request");

    return ResponseEntity
        .ok(ApiResponse.success("Email xác thực thành công"));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email) {
    log.info("Forgot password request for email: {}", email);

    return ResponseEntity
        .ok(ApiResponse.success("Vui lòng kiểm tra email để đặt lại mật khẩu"));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<ApiResponse<Void>> resetPassword(
      @RequestParam String token,
      @RequestParam String newPassword) {
    log.info("Reset password request");

    return ResponseEntity
        .ok(ApiResponse.success("Đặt lại mật khẩu thành công"));
  }
}
