package com.example.server.service;

import com.example.server.entity.Member;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.security.entity.EmailVerificationToken;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Log4j2
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    /** verified=true 토큰이 있어야 비밀번호 변경 가능 */
    @Transactional
    public void resetPassword(String email, String rawPassword) {
        EmailVerificationToken token = tokenRepository.findByEmailAndVerifiedTrue(email)
                .orElseThrow(() -> new IllegalStateException("이메일 인증이 완료되지 않았습니다."));

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        member.setPassword(passwordEncoder.encode(rawPassword));
        memberRepository.save(member);

        tokenRepository.delete(token); // 재사용 방지
        log.info("비밀번호 변경 완료: {}", email);
    }
}
