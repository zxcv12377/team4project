package com.example.server.initializer;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadDirInitializer {
    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Path path = Paths.get(uploadDir);
        if (Files.notExists(path)) {
            Files.createDirectories(path);
            System.out.println("📁 업로드 디렉터리 자동 생성됨: " + path.toAbsolutePath());
        }
    }
}
