package com.cnlthd.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

  private boolean success;
  private String message;
  private T data;
  private long timestamp;

  public ApiResponse(boolean success, String message, T data) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = System.currentTimeMillis();
  }

  public static <T> ApiResponse<T> success(String message, T data) {
    return ApiResponse.<T>builder()
        .success(true)
        .message(message)
        .data(data)
        .timestamp(System.currentTimeMillis())
        .build();
  }

  public static <T> ApiResponse<T> success(String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .message(message)
        .timestamp(System.currentTimeMillis())
        .build();
  }

  public static <T> ApiResponse<T> error(String message) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .timestamp(System.currentTimeMillis())
        .build();
  }
}
