package com.example.server.controller;

import com.example.server.dto.EmailRequestDTO;

import com.example.server.service.EmailVerificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/email")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/send")
    public ResponseEntity<?> sendEmail(@RequestBody EmailRequestDTO dto) {
        emailVerificationService.sendVerificationEmail(dto.getEmail());
        return ResponseEntity.ok("인증 코드가 전송되었습니다.");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyAndRegister(@RequestBody EmailRequestDTO dto) {
        emailVerificationService.verifyTokenAndRegister(
                dto.getEmail(),
                dto.getNickname(),
                dto.getPassword(),
                dto.getToken());
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }
}
