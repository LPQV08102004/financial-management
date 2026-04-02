package com.cnlthd.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

  @NotBlank(message = "Tên không được để trống")
  private String fullname;

  @NotBlank(message = "Số điện thoại không được để trống")
  @Size(min = 10, max = 20, message = "Số điện thoại không hợp lệ")
  private String sdt;
}
