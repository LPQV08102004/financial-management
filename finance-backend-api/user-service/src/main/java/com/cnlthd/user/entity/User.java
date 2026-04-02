package com.cnlthd.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_role", columnList = "role")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  private String id;

  @Column(nullable = false, length = 255)
  private String fullname;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(length = 20)
  private String sdt;

  @Column(nullable = false, length = 255)
  private String password;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role = UserRole.CUSTOMER;

  @Column(nullable = false)
  private Boolean isActive = true;

  @Column(name = "last_login_at")
  private LocalDateTime lastLoginAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  public enum UserRole {
    ADMIN("admin"),
    CUSTOMER("customer");

    private final String value;

    UserRole(String value) {
      this.value = value;
    }

    public String getValue() {
      return value;
    }

    public static UserRole fromString(String value) {
      for (UserRole role : UserRole.values()) {
        if (role.value.equalsIgnoreCase(value)) {
          return role;
        }
      }
      throw new IllegalArgumentException("Invalid role: " + value);
    }
  }
}
