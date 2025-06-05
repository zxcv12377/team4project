package com.example.server.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.AuthenticationException;
// import org.springframework.security.core.context.SecurityContext;
// import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.RequestBody;

@Log4j2
@RequiredArgsConstructor
@RequestMapping("/member")
@RestController
public class MemberController {

    private final MemberService service;

    // private final AuthenticationManager authenticationManager;

    @GetMapping("/login")
    public String getLogin() {
        log.info("로그인 요청");
        return "member/login";
    }

    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        log.info("로그아웃 요청");
        request.getSession().invalidate(); // 세션 무효화
        return "redirect:/"; // 홈으로 리다이렉트
    }

    @GetMapping("/register")
    public String getRegister() {
        log.info("회원가입 요청");
        return "member/register";
    }

    @PostMapping("/register") // json 형식으로 회원가입 요청
    public ResponseEntity<?> register(@RequestBody @Valid MemberRequestDTO dto) {
        try {
            MemberResponseDTO response = service.register(dto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("회원가입 실패");
        }
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody MemberRequestDTO dto, HttpServletRequest request) {
        boolean authenticated = service.authenticate(dto.getNickname(), dto.getPassword());
        log.info("로그인 요청: nickname={}, password={}", dto.getNickname(), dto.getPassword());

        if (authenticated) {
            request.getSession().setAttribute("loginUser", dto.getNickname());
            return "redirect:/";
        } else {
            log.warn("로그인 실패: 아이디 또는 비밀번호 틀림");
            return "member/login";
        }
    }

}
