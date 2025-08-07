package com.example.server.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.VerryConResponseDTO;
import com.example.server.service.VerryConService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/verrycons")
public class VerryConController {
    private final VerryConService verryConService;

    @GetMapping
    public List<VerryConResponseDTO> getAll() {
        return verryConService.getAllVerryCons();
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')") // Spring Security에서 관리자 권한 제한
    public ResponseEntity<?> uploadAkakon(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) {
        try {
            VerryConResponseDTO saved = verryConService.uploadVerryCon(name, file);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("업로드 실패: " + e.getMessage());
        }
    }
}
