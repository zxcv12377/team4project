package com.example.server.controller;

import com.example.server.dto.EmailRequestDTO;
import com.example.server.dto.EmailVerifyDTO;
import com.example.server.dto.PasswordResetDTO;
import com.example.server.service.EmailVerificationService;
import com.example.server.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/passwordreset")
public class PasswordResetController {

    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

    /** 0단계: 이메일로 인증코드 발송 */
    @PostMapping("/email")
    public ResponseEntity<Void> sendResetEmail(@Valid @RequestBody EmailRequestDTO dto) {
        emailVerificationService.sendPasswordResetEmail(dto.getEmail());
        return ResponseEntity.ok().build(); // 200
    }

    /** 1단계: 이메일 + 코드 검증 */
    @PostMapping("/verify")
    public ResponseEntity<Void> verifyCodeForReset(@Valid @RequestBody EmailVerifyDTO dto) {
        emailVerificationService.verifyTokenForReset(dto.getEmail(), dto.getCode());
        return ResponseEntity.ok().build(); // 200
    }

    /** 2단계: 새 비밀번호 확정 */
    @PostMapping("/confirm")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody PasswordResetDTO dto) {
        passwordResetService.resetPassword(dto.getEmail(), dto.getNewPassword());
        return ResponseEntity.ok("비밀번호가 변경되었습니다.");
    }
}
