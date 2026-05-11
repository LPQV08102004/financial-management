package com.cnlthd.user.service;

import com.cnlthd.user.dto.request.ChangePasswordRequest;
import com.cnlthd.user.dto.request.SignupRequest;
import com.cnlthd.user.dto.request.UpdateProfileRequest;
import com.cnlthd.user.dto.response.UserDto;
import com.cnlthd.user.entity.User;
import com.cnlthd.user.exception.InvalidCredentialsException;
import com.cnlthd.user.exception.UserAlreadyExistsException;
import com.cnlthd.user.exception.UserNotFoundException;
import com.cnlthd.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@Slf4j
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public UserDto signup(SignupRequest request) {
    log.info("Creating new user with email: {}", request.getEmail());

    if (userRepository.existsByEmail(request.getEmail())) {
      throw new UserAlreadyExistsException("Email đã được đăng ký");
    }

    User user = User.builder()
        .id(UUID.randomUUID().toString())
        .email(request.getEmail())
        .fullname(request.getFullname())
        .sdt(request.getSdt())
        .password(passwordEncoder.encode(request.getPassword()))
        .role(User.UserRole.CUSTOMER)
        .isActive(true)
        .build();

    User savedUser = userRepository.save(user);
    log.info("User created successfully with id: {}", savedUser.getId());

    return UserDto.fromEntity(savedUser);
  }

  public User getUserByEmail(String email) {
    return userRepository.findByEmailAndDeletedAtIsNull(email)
        .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));
  }

  public User getUserById(String userId) {
    return userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));
  }

  public UserDto getProfile(String userId) {
    User user = getUserById(userId);
    return UserDto.fromEntity(user);
  }

  public UserDto updateProfile(String userId, UpdateProfileRequest request) {
    log.info("Updating profile for user: {}", userId);

    User user = getUserById(userId);
    user.setFullname(request.getFullname());
    user.setSdt(request.getSdt());

    User updatedUser = userRepository.save(user);
    log.info("Profile updated for user: {}", userId);

    return UserDto.fromEntity(updatedUser);
  }

  public void changePassword(String userId, ChangePasswordRequest request) {
    log.info("Changing password for user: {}", userId);

    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
      throw new InvalidCredentialsException("Mật khẩu mới không khớp");
    }

    User user = getUserById(userId);

    if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
      throw new InvalidCredentialsException("Mật khẩu cũ không chính xác");
    }

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

    log.info("Password changed for user: {}", userId);
  }

  public boolean validatePassword(String email, String password) {
    User user = userRepository.findByEmailAndDeletedAtIsNull(email)
        .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));

    return passwordEncoder.matches(password, user.getPassword());
  }
}
