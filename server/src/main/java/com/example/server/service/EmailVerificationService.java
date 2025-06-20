package com.example.server.service;

import com.example.server.security.entity.EmailVerificationToken;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;

@Log4j2
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String email) {
        if (memberRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }
        tokenRepository.deleteByEmail(email);

        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase(); // 6자리 코드 생성
        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(email)
                .token(code)
                .expirationDate(LocalDateTime.now().plusMinutes(3))
                .verified(false)
                .build();
        tokenRepository.save(token);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("[인증] 이메일 확인 코드");
            helper.setText("이메일 인증 코드: " + code);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("이메일 전송 실패", e);
        }

    }

    public void verifyTokenAndRegister(String email, String nickname, String password, String tokenValue) {
        EmailVerificationToken token = tokenRepository.findByEmailAndToken(email, tokenValue)
                .orElseThrow(() -> new RuntimeException("인증 코드가 올바르지 않습니다."));

        if (token.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("인증 코드가 만료되었습니다.");
        }

        String encodedPassword = passwordEncoder.encode(password);

        Member member = Member.builder()
                .email(email)
                .nickname(nickname)
                .password(encodedPassword)
                .emailVerified(true)
                .agree(true)
                .build();

        memberRepository.save(member);
        tokenRepository.delete(token);
    }

    private String generateCode() {
        return String.valueOf((int) (Math.random() * 9000) + 1000); // 4자리 랜덤
    }
}