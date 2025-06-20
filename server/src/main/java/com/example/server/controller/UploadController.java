package com.example.server.controller;

import java.nio.file.Paths;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 없습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        String filename = UUID.randomUUID() + "_" + originalFilename;

        Path filepath = Paths.get(uploadDir, filename);
        Files.createDirectories(filepath.getParent());
        Files.copy(file.getInputStream(), filepath, StandardCopyOption.REPLACE_EXISTING);

        // 클라이언트에서 이 URL로 접근하게 할 수 있음 (예: /uploads/uuid_img.jpg)
        String fileUrl = "/uploads/" + filename;
        return ResponseEntity.ok(fileUrl);
    }
}
