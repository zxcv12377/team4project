package com.example.server.service;

import java.awt.image.BufferedImage;
import java.io.*;
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

    private final String uploadDir = "src/main/resources/static/uploads/images/";

    public ImageDTO saveImage(MultipartFile file) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(file.getOriginalFilename());
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + "original/" + fileName);
        Path thumbnailPath = Paths.get(uploadDir + "thumbnail/" + uuid + "_thumb." + ext);

        Files.createDirectories(originalPath.getParent());
        Files.createDirectories(thumbnailPath.getParent());

        // Save original file
        file.transferTo(originalPath);

        // Create and save thumbnail
        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(200, 200)
                .toFile(thumbnailPath.toFile());

        return new ImageDTO(
                "/uploads/images/original/" + fileName,
                "/uploads/images/thumbnail/" + uuid + "_thumb." + ext);
    }

    public ImageDTO saveImageFromUrl(String imageUrl) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(imageUrl);
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + "original/" + fileName);
        Path thumbnailPath = Paths.get(uploadDir + "thumbnail/" + uuid + "_thumb." + ext);

        Files.createDirectories(originalPath.getParent());
        Files.createDirectories(thumbnailPath.getParent());

        // Download image
        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, originalPath, StandardCopyOption.REPLACE_EXISTING);
        }

        // Create thumbnail
        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(200, 200)
                .toFile(thumbnailPath.toFile());

        return new ImageDTO(
                "/uploads/images/original/" + fileName,
                "/uploads/images/thumbnail/" + uuid + "_thumb." + ext);
    }

    private String getExtension(String filename) {
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
