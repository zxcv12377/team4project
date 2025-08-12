package com.example.server.controller;

import java.nio.file.Paths;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    @Value("${file.upload-dir}") // 예: /home/ubuntu/server/uploads
    private String uploadDir;

    @Value("${file.public-prefix:/uploads}") // Nginx alias 기준 공개 prefix
    private String publicPrefix;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "dir", required = false, defaultValue = "") String dir) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "empty file"));
        }

        // 안전한 디렉토리 정규화 (경로 이탈 방지)
        String safeDir = dir.replace("\\", "/")
                .replace("..", "")
                .replaceAll("^/+", "")
                .replaceAll("/+", "/");

        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetDir = safeDir.isBlank() ? base : base.resolve(safeDir).normalize();
        if (!targetDir.startsWith(base)) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid dir"));
        }
        Files.createDirectories(targetDir);

        // 파일명 생성 (원본 확장자만 사용)
        String ext = StringUtils.getFilenameExtension(
                Optional.ofNullable(file.getOriginalFilename()).orElse(""));
        String filename = UUID.randomUUID().toString().replace("-", "");
        if (ext != null && !ext.isBlank())
            filename += "." + ext.toLowerCase();

        Path target = targetDir.resolve(filename);
        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        // 공개 경로 생성
        String publicPath = publicPrefix
                + (safeDir.isBlank() ? "" : "/" + safeDir)
                + "/" + filename;

        return ResponseEntity.ok(Map.of("path", publicPath));
    }
}
