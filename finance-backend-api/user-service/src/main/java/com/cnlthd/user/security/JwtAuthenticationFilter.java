package com.cnlthd.user.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtTokenProvider jwtTokenProvider;

  public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String authHeader = request.getHeader("Authorization");

      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);

        if (jwtTokenProvider.validateToken(token)) {
          String userId = jwtTokenProvider.getUserIdFromToken(token);
          String role = jwtTokenProvider.getRoleFromToken(token);

          Collection<GrantedAuthority> authorities = new ArrayList<>();
          authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));

          UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
              userId, null, authorities);

          SecurityContextHolder.getContext().setAuthentication(authentication);

          log.debug("JWT Token validated for user: {}", userId);
        } else {
          log.warn("Invalid JWT Token");
        }
      }
    } catch (Exception e) {
      log.error("Error processing JWT Token: {}", e.getMessage());
    }

    filterChain.doFilter(request, response);
  }
}
