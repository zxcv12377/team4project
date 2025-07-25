package com.example.server.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.ImageDTO;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageService {

    private final String UPLOAD_DIR = "uploads";
    private final String ORIGINAL_DIR = UPLOAD_DIR + "/original/";
    private final String THUMBNAIL_DIR = UPLOAD_DIR + "/thumbnail/";

    public ImageDTO uploadImage(MultipartFile file) throws Exception {
        // ✅ 디렉토리 생성 (처음 1회)
        Files.createDirectories(Paths.get(ORIGINAL_DIR));
        Files.createDirectories(Paths.get(THUMBNAIL_DIR));

        // ✅ MIME & 용량 체크
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
        if (file.getSize() > 3 * 1024 * 1024) {
            throw new IllegalArgumentException("최대 3MB까지만 업로드 가능합니다.");
        }

        // ✅ 파일명 생성
        String extension = getExtension(file.getOriginalFilename());
        String uuid = UUID.randomUUID().toString();
        String fileName = uuid + "." + extension;

        // ✅ 원본 저장
        File originalFile = new File(ORIGINAL_DIR + fileName);
        file.transferTo(originalFile);

        // ✅ 썸네일 생성
        File thumbnailFile = new File(THUMBNAIL_DIR + fileName);
        try (InputStream is = Files.newInputStream(originalFile.toPath())) {
            Thumbnails.of(is)
                    .size(300, 300)
                    .toFile(thumbnailFile);
        }

        // ✅ 경로 리턴
        return new ImageDTO(
                "/uploads/original/" + fileName,
                "/uploads/thumbnail/" + fileName);
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf(".");
        return (dot != -1) ? fileName.substring(dot + 1).toLowerCase() : "";
    }
}
