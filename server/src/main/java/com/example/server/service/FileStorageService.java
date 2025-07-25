package com.example.server.service;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.*;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.ImageDTO;

import net.coobird.thumbnailator.Thumbnails;

@Service
public class FileStorageService {

    // ✅ 팀 공용 로컬 저장소 경로
    private final String uploadDir = "C:/source/team4project/uploads/";

    // ✅ 이미지 업로드 (파일)
    public ImageDTO saveImage(MultipartFile file) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(file.getOriginalFilename());
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + "original/" + fileName);
        Path thumbnailPath = Paths.get(uploadDir + "thumbnail/" + uuid + "_thumb." + ext);

        Files.createDirectories(originalPath.getParent());
        Files.createDirectories(thumbnailPath.getParent());

        file.transferTo(originalPath);

        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(200, 200)
                .toFile(thumbnailPath.toFile());

        return new ImageDTO(
                "/uploads/original/" + fileName,
                "/uploads/thumbnail/" + uuid + "_thumb." + ext);
    }

    public ImageDTO saveImageFromUrl(String imageUrl) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(imageUrl);
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + "original/" + fileName);
        Path thumbnailPath = Paths.get(uploadDir + "thumbnail/" + uuid + "_thumb." + ext);

        Files.createDirectories(originalPath.getParent());
        Files.createDirectories(thumbnailPath.getParent());

        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, originalPath, StandardCopyOption.REPLACE_EXISTING);
        }

        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(200, 200)
                .toFile(thumbnailPath.toFile());

        return new ImageDTO(
                "/uploads/original/" + fileName,
                "/uploads/thumbnail/" + uuid + "_thumb." + ext);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "png";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
