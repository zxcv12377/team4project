package com.example.server.controller;

import com.example.server.dto.EmailRequestDTO;
import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.jwt.JwtUtil;
import com.example.server.security.CustomMemberDetails;
import com.example.server.security.CustomMemberDetailsService;
import com.example.server.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // POST: 회원가입
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid EmailRequestDTO dto) {
        memberService.register(dto.getEmail());
        return ResponseEntity.ok(Map.of("message", "이메일 인증 코드가 발송되었습니다."));
    }

    // POST: 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MemberRequestDTO dto) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "아이디 또는 비밀번호가 올바르지 않습니다."));
        }

        String token = jwtUtil.generateToken(dto.getEmail());
        MemberResponseDTO user = memberService.getUserInfo(dto.getEmail());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "user", user));
    }

    // GET: 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal CustomMemberDetails userDetails) {
        MemberResponseDTO user = memberService.getUserInfo(userDetails.getEmail());
        return ResponseEntity.ok(user);
    }

    // PUT: 내 정보 수정(닉네임, 프로필 사진)
    @PutMapping("/update")
    public ResponseEntity<?> update(@AuthenticationPrincipal CustomMemberDetails userDetails,
            @RequestBody MemberRequestDTO dto) {
        memberService.updateUserInfo(userDetails.getEmail(), dto);
        return ResponseEntity.ok(Map.of("message", "닉네임 변경 성공"));
    }

    // PUT: 비밀번호 변경
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal CustomMemberDetails userDetails,
            @RequestBody Map<String, String> passwordMap) {
        log.info("[Controller] userDetails.getEmail(): {}", userDetails.getEmail());
        String currentPassword = passwordMap.get("currentPassword");
        String newPassword = passwordMap.get("newPassword");
        memberService.changePassword(userDetails.getEmail(), currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("message", "비밀번호 변경 성공"));
    }

    // POST: 로그아웃 (토큰 삭제는 프론트에서 처리)
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "로그아웃 완료")); // JWT는 서버에서 무효화하지 않음
    }

    // DELETE: 회원 탈퇴
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteMember(@AuthenticationPrincipal CustomMemberDetails userDetails) {
        memberService.delete(userDetails.getEmail());
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 완료"));
    }

    @PutMapping("/comment")
    public ResponseEntity<?> updateComment(@AuthenticationPrincipal CustomMemberDetails userDetails,
            @RequestBody Map<String, String> req) {
        String comment = req.get("comment");
        System.out.println("코멘트 로그");
        memberService.updateComment(userDetails.getEmail(), comment);
        return ResponseEntity.ok(Map.of("message", "코멘트 수정 완료"));
    }

}
