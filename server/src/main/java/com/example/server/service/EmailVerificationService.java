package com.example.server.service;

import com.example.server.entity.Member;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.security.entity.EmailVerificationToken;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
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

        // 임시 Member 저장
        Member tempMember = Member.builder()
                .email(email)
                .nickname("TEMP")
                .password("TEMP")
                .emailVerified(false)
                .build();
        memberRepository.save(tempMember);

        // 인증 코드 생성 및 저장
        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        EmailVerificationToken token = EmailVerificationToken.builder()
                .member(tempMember)
                .token(code)
                .expirationDate(LocalDateTime.now().plusMinutes(3))
                .verified(false)
                .build();

        tokenRepository.save(token);

        // 인증 메일 발송
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
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

        EmailVerificationToken token = tokenRepository.findByMemberAndToken(member, tokenValue)
                .orElseThrow(() -> new RuntimeException("인증 코드가 올바르지 않습니다."));

        if (token.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("인증 코드가 만료되었습니다.");
        }
        if (memberRepository.existsByNickname(nickname)) {
        throw new RuntimeException("이미 사용 중인 닉네임입니다.");
    }

        member.setNickname(nickname);
        member.setPassword(passwordEncoder.encode(password));
        member.setEmailVerified(true);
        memberRepository.save(member);

        token.setVerified(true);
        tokenRepository.save(token);
    }
}
