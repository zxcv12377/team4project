package com.example.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.AuthenticationException;
// import org.springframework.security.core.context.SecurityContext;
// import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.RequestBody;

@Log4j2
@RequiredArgsConstructor
@RequestMapping("/member")
@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MemberController {

    private final MemberService memberService;

    // private final AuthenticationManager authenticationManager;

    @GetMapping("/login")
    public String getLogin() {
        log.info("로그인 요청");
        return "member/login";
    }

    @GetMapping("/logout")
    public String getLogout(HttpServletRequest request) {
        log.info("로그아웃 요청");
        request.getSession().invalidate(); // 세션 무효화
        return "redirect:/"; // 홈으로 리다이렉트
    }

    @GetMapping("/register")
    public String getRegister() {
        log.info("회원가입 요청");
        return "member/register";
    }

    @GetMapping("/me")
    // public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
    // String nickname = (String) request.getSession().getAttribute("loginUser");
    // if (nickname == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    // }

    // Member member = memberService.findByNickname(nickname);
    // if (member == null) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자 없음");
    // }

    // MemberResponseDTO dto = MemberResponseDTO.builder()
    // .mno(member.getId())
    // .nickname(member.getNickname())
    // .email(member.getEmail())
    // .profileimg(member.getProfileimg())
    // .build();

    // return ResponseEntity.ok(dto);
    // }

    @PostMapping("/register") // json 형식으로 회원가입 요청
    public ResponseEntity<?> register(@RequestBody @Valid MemberRequestDTO dto) {
        try {
            MemberResponseDTO response = memberService.register(dto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("회원가입 실패");
        }
    }

    // @PostMapping("/login")
    // public ResponseEntity<?> loginUser(@RequestBody MemberRequestDTO dto,
    // HttpServletRequest request) {
    // log.info("로그인 요청: nickname={}, password={}", dto.getNickname(),
    // dto.getPassword());

    // Member member = memberService.authenticate(dto.getNickname(),
    // dto.getPassword());

    // if (member != null) {
    // request.getSession().setAttribute("loginUser", member.getNickname());

    // // 로그인 성공 시 세션에 사용자 정보 저장(react에서 사용할 때 res.data success로 확인 가능)
    // Map<String, Object> response = new HashMap<>();
    // response.put("success", true);
    // response.put("user", new MemberResponseDTO(member));
    // return ResponseEntity.ok(response);
    // } else {
    // log.warn("로그인 실패: 아이디 또는 비밀번호 틀림");
    // Map<String, Object> error = new HashMap<>();
    // error.put("success", false);
    // error.put("message", "닉네임 또는 비밀번호가 틀렸습니다.");
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    // }
    // }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        request.getSession().invalidate(); // 세션 제거
        return ResponseEntity.ok("로그아웃 완료");
    }

    // @PostMapping("/profile-image")
    // public ResponseEntity<?> uploadProfileImage(@RequestParam("file")
    // MultipartFile file,
    // HttpSession session) {
    // String nickname = (String) session.getAttribute("loginUser");
    // if (nickname == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    // }

    // String imagePath = memberService.updateProfileImageByNickname(nickname,
    // file);
    // return ResponseEntity.ok(imagePath);
    // }

    // @PutMapping("/update")
    // public ResponseEntity<?> updateUser(@RequestBody MemberRequestDTO dto,
    // HttpServletRequest request) {
    // String nickname = (String) request.getSession().getAttribute("loginUser");
    // if (nickname == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    // }

    // try {
    // memberService.updateUserInfo(nickname, dto);
    // return ResponseEntity.ok("수정 완료");
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("수정 실패: " +
    // e.getMessage());
    // }
    // }

    // @PutMapping("/password")
    // public ResponseEntity<?> changePassword(@RequestBody Map<String, String>
    // body, HttpServletRequest request) {
    // String nickname = (String) request.getSession().getAttribute("loginUser");
    // if (nickname == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    // }

    // String currentPassword = body.get("currentPassword");
    // String newPassword = body.get("newPassword");

    // try {
    // memberService.changePassword(nickname, currentPassword, newPassword);
    // return ResponseEntity.ok("비밀번호 변경 완료");
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    // }
    // }

    // @DeleteMapping("/delete")
    // public ResponseEntity<String> deleteUser(HttpServletRequest request) {
    // String nickname = (String) request.getSession().getAttribute("loginUser");
    // if (nickname == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
    // }

    // memberService.deleteByNickname(nickname);
    // request.getSession().invalidate();
    // return ResponseEntity.ok("회원 탈퇴 완료");
    // }

}
