package com.cnlthd.user.controller;

import com.cnlthd.user.dto.response.ApiResponse;
import com.cnlthd.user.dto.response.UserDto;
import com.cnlthd.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

  private final UserRepository userRepository;

  public AdminUserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<?>> listUsers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    log.info("Admin: List users - page: {}, size: {}", page, size);
    
    Pageable pageable = PageRequest.of(page, size);
    Page<?> users = userRepository.findAll(pageable)
        .map(UserDto::fromEntity);
    
    return ResponseEntity
        .ok(ApiResponse.success("Danh sách người dùng", users));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String id) {
    log.info("Admin: Get user by id: {}", id);
    
    UserDto userDto = userRepository.findById(id)
        .map(UserDto::fromEntity)
        .orElseThrow(() -> new RuntimeException("User not found"));
    
    return ResponseEntity
        .ok(ApiResponse.success("Thông tin người dùng", userDto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
    log.info("Admin: Delete user: {}", id);
    
    var user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found"));
    
    // Soft delete
    userRepository.delete(user);
    
    return ResponseEntity
        .ok(ApiResponse.success("Xóa người dùng thành công"));
  }

  @PutMapping("/{id}/deactivate")
  public ResponseEntity<ApiResponse<UserDto>> deactivateUser(@PathVariable String id) {
    log.info("Admin: Deactivate user: {}", id);
    
    var user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found"));
    
    user.setIsActive(false);
    userRepository.save(user);
    
    return ResponseEntity
        .ok(ApiResponse.success("Vô hiệu hóa người dùng thành công", UserDto.fromEntity(user)));
  }

  @PutMapping("/{id}/activate")
  public ResponseEntity<ApiResponse<UserDto>> activateUser(@PathVariable String id) {
    log.info("Admin: Activate user: {}", id);
    
    var user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found"));
    
    user.setIsActive(true);
    userRepository.save(user);
    
    return ResponseEntity
        .ok(ApiResponse.success("Kích hoạt người dùng thành công", UserDto.fromEntity(user)));
  }
}
