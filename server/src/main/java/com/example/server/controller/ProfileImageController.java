package com.example.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.jwt.JwtUtil;
import com.example.server.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/member/profile-image")
public class ProfileImageController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    private final String uploadDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;

    @PostMapping
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 비어 있습니다.");
        }

        String token = extractToken(request);
        String email = jwtUtil.validateAndGetSubject(token);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFilename);
        String savedFilename = UUID.randomUUID() + "." + extension;

        try {
            // 디렉토리 없으면 생성
            File uploadPath = new File(uploadDir);
            if (!uploadPath.exists())
                uploadPath.mkdirs();

            // 이전 이미지 삭제
            String oldFilename = memberService.getProfileImageFilename(email);
            if (!"default.png".equals(oldFilename)) {
                File oldFile = new File(uploadDir + oldFilename);
                if (oldFile.exists())
                    oldFile.delete();
            }

            // 새 이미지 저장
            file.transferTo(new File(uploadDir + savedFilename));

            // DB 업데이트
            memberService.updateProfileImage(email, savedFilename);

            return ResponseEntity.ok("프로필 이미지가 업로드되었습니다.");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("파일 업로드 중 오류: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getProfileImagePath(HttpServletRequest request) {
        String token = extractToken(request);
        String email = jwtUtil.validateAndGetSubject(token);

        String filename = memberService.getProfileImageFilename(email);
        if (filename == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("프로필 이미지가 없습니다.");
        }

        String imageUrl = "/uploads/" + filename;
        return ResponseEntity.ok(imageUrl);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        throw new RuntimeException("Authorization 헤더에 토큰이 없습니다.");
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx != -1 ? filename.substring(idx + 1) : "png";
    }
}
