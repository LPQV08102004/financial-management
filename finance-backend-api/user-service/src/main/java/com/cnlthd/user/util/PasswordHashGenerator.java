package com.cnlthd.user.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password1 = "admin123";
        String password2 = "password123";
        
        String hash1 = encoder.encode(password1);
        String hash2 = encoder.encode(password2);
        
        System.out.println("Hash for 'admin123': " + hash1);
        System.out.println("Hash for 'password123': " + hash2);
        
        // Verify
        System.out.println("\nVerification:");
        System.out.println("admin123 matches: " + encoder.matches(password1, hash1));
        System.out.println("password123 matches: " + encoder.matches(password2, hash2));
    }
}
