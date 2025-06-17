package com.example.server.controller;

import com.example.server.entity.Member;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.security.entity.EmailVerificationToken;
import com.example.server.service.EmailVerificationService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final MemberRepository memberRepository;
    private final EmailVerificationTokenRepository tokenRepository;

    @PostMapping("/verify")
    public ResponseEntity<String> verifyCode(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");

        EmailVerificationToken token = tokenRepository.findByMemberEmail(email)
                .orElseThrow(() -> new RuntimeException("인증 코드가 존재하지 않습니다."));

        if (!token.getCode().equals(code)) {
            return ResponseEntity.badRequest().body("인증 코드가 일치하지 않습니다.");
        }
        if (token.isExpired()) {
            return ResponseEntity.badRequest().body("인증 코드가 만료되었습니다.");
        }

        Member member = token.getMember();
        member.setEmailVerified(true);
        memberRepository.save(member);
        tokenRepository.delete(token); // 인증 끝났으니 삭제

        return ResponseEntity.ok("이메일 인증 성공");
    }

}
