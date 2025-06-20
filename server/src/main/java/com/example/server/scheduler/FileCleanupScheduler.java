package com.example.server.scheduler;

import java.io.File;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FileCleanupScheduler {

    // 실제 업로드 폴더 경로 (환경에 맞게 설정)
    private final String uploadBasePath = "C:/javadb/spring/upload";

    @Scheduled(cron = "* * 3 * * *") // 매일 새벽 3시에 실행 예시
    public void cleanupAllFiles() {
        File uploadDir = new File(uploadBasePath);
        if (!uploadDir.exists() || !uploadDir.isDirectory()) {
            System.err.println("Upload directory not found or not a directory.");
            return;
        }

        File[] files = uploadDir.listFiles();
        if (files == null) {
            System.out.println("No files to delete.");
            return;
        }

        for (File file : files) {
            if (file.isFile()) {
                if (file.delete()) {
                    System.out.println("Deleted file: " + file.getAbsolutePath());
                } else {
                    System.err.println("Failed to delete file: " + file.getAbsolutePath());
                }
            }
        }
    }
}
