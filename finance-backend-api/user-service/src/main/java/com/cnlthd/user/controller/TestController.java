package com.cnlthd.user.controller;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

  private final PasswordEncoder passwordEncoder;

  public TestController(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  @PostMapping("/hash-password")
  public String hashPassword(@RequestParam String password) {
    return passwordEncoder.encode(password);
  }
}
