package com.example.server.service;

import com.example.server.security.entity.EmailVerificationToken;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.entity.Member;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Log4j2
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final MemberRepository memberRepository;
    private final JavaMailSender mailSender;

    public EmailVerificationToken sendVerificationEmail(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 없음"));

        String code = String.format("%04d", new Random().nextInt(10000)); // 4자리 랜덤 코드
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(10);

        EmailVerificationToken emailToken = EmailVerificationToken.builder()
                .member(member)
                .code(code)
                .expiryDate(expiry)
                .build();

        tokenRepository.save(emailToken);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("이메일 인증 코드 안내");
        message.setText("아래 인증 코드를 입력해주세요:\n\n인증 코드: " + code);

        mailSender.send(message);

        return emailToken;
    }

    @Transactional
    public boolean verifyToken(String email) {
        Optional<EmailVerificationToken> optional = tokenRepository.findByMemberEmail(email);

        if (optional.isEmpty())
            return false;

        EmailVerificationToken emailToken = optional.get();
        if (emailToken.isExpired())
            return false;

        Member member = emailToken.getMember();
        member.setEmailVerified(true);
        memberRepository.save(member);

        return true;
    }
}
