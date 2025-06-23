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
    
    Optional<EmailVerificationToken> findByMemberAndToken(Member member, String token);


    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken t WHERE t.member = :member")
    void deleteByMember(@Param("member") Member member);

    @Modifying
    @Transactional
    void deleteAllByMember_Email(String email);

    @Modifying
    @Transactional
    void deleteByExpirationDateBefore(LocalDateTime time);

    Optional<EmailVerificationToken> findByMemberAndTokenAndVerifiedFalseAndExpirationDateAfter(
    Member member, String token, LocalDateTime now);

    Optional<EmailVerificationToken> findByMemberAndVerifiedTrue(Member member);
}
