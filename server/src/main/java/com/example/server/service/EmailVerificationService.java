package com.example.server.service;

import com.example.server.entity.Member;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.security.entity.EmailVerificationToken;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Log4j2
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepo;
    private final MemberRepository memberRepo;
    private final PasswordEncoder encoder;
    private final JavaMailSender mailSender;

    // UUID기반 6자리 영어&숫자 조합 코드
    private String generateRandomCode() {
        return UUID.randomUUID().toString()
                .replace("-", "") // 하이픈 제거
                .substring(0, 6)
                .toUpperCase();
    }

    // 회원가입용 인증메일 발송코드
    @Transactional
    public void sendVerificationEmail(String email) {
        if (memberRepo.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }
        tokenRepo.deleteByEmail(email); // 이전 미검증 토큰 제거

        String code = generateRandomCode(); // 6자리 영문+숫자
        saveToken(email, code, false);
        sendMail(email, "[Team4] 이메일 인증 코드", "회원가입 인증 코드: " + code);
    }

    // 비밀번호 찾기용 인증메일 발송코드
    @Transactional
    public void sendPasswordResetEmail(String email) {
        memberRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 계정입니다."));

        tokenRepo.deleteByEmail(email); // 이전 토큰 제거
        String code = generateRandomCode();
        saveToken(email, code, false);
        sendMail(email, "[Team4] 비밀번호 재설정 코드",
                "아래 6자리 코드를 10분 내에 입력하세요.\n\n" + code);
    }

    // 회원가입 코드 검증
    @Transactional
    public void verifyTokenAndRegister(String email,
            String nickname,
            String rawPw,
            String code) {

        EmailVerificationToken token = getValidToken(email, code);
        token.setVerified(true);
        tokenRepo.save(token);

        Member member = Member.builder()
                .email(email)
                .nickname(nickname)
                .password(encoder.encode(rawPw))
                .emailVerified(true)
                .agree(true)
                .build();
        memberRepo.save(member);

        tokenRepo.delete(token); // 재사용 방지
    }

    // 비밀번호찾기 코드검증
    @Transactional
    public void verifyTokenForReset(String email, String code) {
        EmailVerificationToken token = getValidToken(email, code);
        token.setVerified(true);
        tokenRepo.save(token); // 삭제는 resetPassword 단계에서
    }

    /** 코드·만료·verified=false 조건을 모두 만족하는 토큰 반환 */
    private EmailVerificationToken getValidToken(String email, String code) {
        EmailVerificationToken token = tokenRepo
                .findByEmailAndToken(email, code)
                .orElseThrow(() -> new RuntimeException("인증 코드가 올바르지 않습니다."));

        if (token.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("인증 코드가 만료되었습니다.");
        }
        if (token.isVerified()) {
            throw new RuntimeException("이미 사용된 인증 코드입니다.");
        }
        return token;
    }

    /** 토큰 저장 헬퍼 */
    private void saveToken(String email, String code, boolean verified) {
        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(email)
                .token(code)
                .verified(verified)
                .expirationDate(LocalDateTime.now().plusMinutes(10))
                .build();
        tokenRepo.save(token);
    }

    /** 메일 전송 헬퍼 */
    private void sendMail(String to, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("이메일 전송 실패", e);
        }
    }
}
