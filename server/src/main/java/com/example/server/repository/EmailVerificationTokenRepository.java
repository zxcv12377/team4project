package com.example.server.repository;

import com.example.server.entity.Member;
import com.example.server.security.entity.EmailVerificationToken;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByEmailAndToken(String email, String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken t WHERE t.email = :email")
    void deleteByEmail(@Param("email") String email);

    @Modifying
    @Transactional
    void deleteByExpirationDateBefore(LocalDateTime time);

    Optional<EmailVerificationToken> findByEmailAndTokenAndVerifiedFalseAndExpirationDateAfter(
            String email, String token, LocalDateTime now);

    Optional<EmailVerificationToken> findByEmailAndVerifiedTrue(String email);
}
