package com.cnlthd.user.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

  @Value("${jwt.secret}")
  private String jwtSecret;

  @Value("${jwt.access-token-expiration}")
  private long accessTokenExpirationMs;

  @Value("${jwt.refresh-token-expiration}")
  private long refreshTokenExpirationMs;

  public String generateAccessToken(String userId, String email, String role) {
    return generateToken(userId, email, role, accessTokenExpirationMs);
  }

  public String generateRefreshToken(String userId, String email, String role) {
    return generateToken(userId, email, role, refreshTokenExpirationMs);
  }

  private String generateToken(String userId, String email, String role, long expirationTime) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

    return Jwts.builder()
        .subject(userId)
        .claim("email", email)
        .claim("role", role)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expirationTime))
        .signWith(key)
        .compact();
  }

  public String getUserIdFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    Claims claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return claims.getSubject();
  }

  public String getRoleFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    Claims claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return (String) claims.get("role");
  }

  public String getEmailFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    Claims claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return (String) claims.get("email");
  }

  public boolean validateToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Jwts.parser()
          .verifyWith(key)
          .build()
          .parseSignedClaims(token);
      return true;
    } catch (Exception e) {
      log.error("JWT validation error: {}", e.getMessage());
      return false;
    }
  }

  public boolean isTokenExpired(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      Claims claims = Jwts.parser()
          .verifyWith(key)
          .build()
          .parseSignedClaims(token)
          .getPayload();
      return claims.getExpiration().before(new Date());
    } catch (Exception e) {
      return true;
    }
  }
}
