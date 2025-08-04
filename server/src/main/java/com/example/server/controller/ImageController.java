package com.example.server.controller;

import com.example.server.dto.ImageDTO;
import com.example.server.dto.ImageUrlRequest;
import com.example.server.service.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Log4j2
public class ImageController {

    private final ImageService imageService;

    // 파일 업로드
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            ImageDTO dto = imageService.uploadImage(file);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("❌ 업로드 실패: {}", e.getMessage());
            return ResponseEntity.status(500).body("이미지 업로드 실패: " + e.getMessage());
        }
    }

    // 외부 이미지 URL 업로드 (선택적 기능)
    @PostMapping("/upload/url")
    public ResponseEntity<?> uploadImageFromUrl(@RequestBody ImageUrlRequest request) {
        try {
            ImageDTO dto = imageService.uploadImageFromUrl(request.getUrl());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("❌ 외부 이미지 업로드 실패: {}", e.getMessage());
            return ResponseEntity.status(500).body("URL 이미지 업로드 실패: " + e.getMessage());
        }
    }
}