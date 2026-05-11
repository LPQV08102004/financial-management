package com.cnlthd.user.controller;

import com.cnlthd.user.dto.request.ChangePasswordRequest;
import com.cnlthd.user.dto.request.UpdateProfileRequest;
import com.cnlthd.user.dto.response.ApiResponse;
import com.cnlthd.user.dto.response.UserDto;
import com.cnlthd.user.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/profile")
  public ResponseEntity<ApiResponse<UserDto>> getProfile() {
    log.info("Get profile request");

    String userId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    UserDto userDto = userService.getProfile(userId);

    return ResponseEntity
        .ok(ApiResponse.success("Lấy thông tin thành công", userDto));
  }

  @PutMapping("/profile")
  public ResponseEntity<ApiResponse<UserDto>> updateProfile(
      @Valid @RequestBody UpdateProfileRequest request) {
    log.info("Update profile request");

    String userId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    UserDto userDto = userService.updateProfile(userId, request);

    return ResponseEntity
        .ok(ApiResponse.success("Cập nhật thông tin thành công", userDto));
  }

  @PostMapping("/change-password")
  public ResponseEntity<ApiResponse<Void>> changePassword(
      @Valid @RequestBody ChangePasswordRequest request) {
    log.info("Change password request");

    String userId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    userService.changePassword(userId, request);

    return ResponseEntity
        .ok(ApiResponse.success("Đổi mật khẩu thành công"));
  }
}
