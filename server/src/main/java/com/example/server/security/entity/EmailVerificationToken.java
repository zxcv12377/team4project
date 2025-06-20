package com.example.server.security.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String token;

    private LocalDateTime expirationDate;
    private boolean verified;

    // @Builder
    // public EmailVerificationToken(String email, String token, LocalDateTime
    // expirationDate) {
    // this.email = email;
    // this.token = token;
    // this.expirationDate = expirationDate;
    // }

    // 10분 유지 코드
    // public static EmailVerificationToken create(String email, String token) {
    // return EmailVerificationToken.builder()
    // .email(email)
    // .token(token)
    // .expirationDate(LocalDateTime.now().plusMinutes(10))
    // .build();
    // }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expirationDate);
    }
}
