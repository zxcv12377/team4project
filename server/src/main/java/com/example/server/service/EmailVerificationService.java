package com.example.server.service;

import com.example.server.security.entity.EmailVerificationToken;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.entity.Member;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final MemberRepository memberRepository;
    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String email) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);

        EmailVerificationToken emailToken = EmailVerificationToken.builder()
                .email(email)
                .token(token)
                .expiryDate(expiry)
                .verified(false)
                .build();

        tokenRepository.save(emailToken);

        String link = "http://localhost:8080/email/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("이메일 인증을 완료해주세요");
        message.setText("아래 링크를 클릭하여 이메일 인증을 완료해주세요:\n\n" + link);

        mailSender.send(message);
    }

    @Transactional
    public boolean verifyToken(String token) {
        Optional<EmailVerificationToken> optional = tokenRepository.findByToken(token);

        if (optional.isEmpty()) return false;

        EmailVerificationToken emailToken = optional.get();
        if (emailToken.isExpired()) return false;

        emailToken.setVerified(true);
        tokenRepository.save(emailToken);

        Member member = memberRepository.findByEmail(emailToken.getEmail())
                .orElseThrow(() -> new RuntimeException("해당 이메일 유저 없음"));

        member.setEmailVerified(true);
        memberRepository.save(member);

        return true;
    }
}
