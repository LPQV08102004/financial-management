package com.cnlthd.user.dto.response;

import com.cnlthd.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

  private String id;
  private String fullname;
  private String email;
  private String sdt;
  private String role;
  private Boolean isActive;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static UserDto fromEntity(User user) {
    return UserDto.builder()
        .id(user.getId())
        .fullname(user.getFullname())
        .email(user.getEmail())
        .sdt(user.getSdt())
        .role(user.getRole().getValue())
        .isActive(user.getIsActive())
        .createdAt(user.getCreatedAt())
        .updatedAt(user.getUpdatedAt())
        .build();
  }
}
