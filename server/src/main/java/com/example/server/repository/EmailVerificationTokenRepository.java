package com.example.server.repository;

import com.example.server.security.entity.EmailVerificationToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    /* 단일 토큰 조회 (verified 상관없음) */
    Optional<EmailVerificationToken> findByEmailAndToken(String email, String token);

    /* verified = false & 만료일 이후 조건 (회원가입/비번찾기 공용) */
    Optional<EmailVerificationToken> findByEmailAndTokenAndVerifiedFalseAndExpirationDateAfter(
            String email, String token, LocalDateTime now);

    /* verified = true 토큰 (비밀번호 재설정 단계) */
    Optional<EmailVerificationToken> findByEmailAndVerifiedTrue(String email);

    /* 특정 이메일의 모든 토큰 삭제 (미사용/재사용 방지) */
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken t WHERE t.email = :email")
    void deleteByEmail(@Param("email") String email);

    /* 만료된 토큰 배치 삭제 (스케줄러 사용 시) */
    @Modifying
    @Transactional
    void deleteByExpirationDateBefore(LocalDateTime time);
}
