package com.example.server.service;

import com.example.server.dto.ImageDTO;
import com.example.server.entity.Image;
import com.example.server.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class ImageService {

    private final ImageRepository imageRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final String ORIGINAL_DIR = "original/";
    private final String THUMBNAIL_DIR = "thumbnail/";

    /**
     * Multipart 이미지 업로드
     */
    public ImageDTO uploadImage(MultipartFile file) throws Exception {
        log.info("📥 이미지 업로드 요청: {}", file.getOriginalFilename());

        // MIME & 사이즈 검사
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
        if (file.getSize() > 3 * 1024 * 1024) {
            throw new IllegalArgumentException("최대 3MB까지만 업로드 가능합니다.");
        }

        // 디렉토리 생성
        Files.createDirectories(Paths.get(uploadDir + ORIGINAL_DIR));
        Files.createDirectories(Paths.get(uploadDir + THUMBNAIL_DIR));

        // 파일 저장
        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(file.getOriginalFilename());
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + ORIGINAL_DIR + fileName);
        Path thumbnailPath = Paths.get(uploadDir + THUMBNAIL_DIR + fileName);

        file.transferTo(originalPath.toFile());

        // 썸네일 생성
        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(300, 300)
                .toFile(thumbnailPath.toFile());

        // URL 구성
        String originalUrl = "/uploads/original/" + fileName;
        String thumbnailUrl = "/uploads/thumbnail/" + fileName;

        // DB 저장
        Image saved = imageRepository.save(Image.builder()
                .originalUrl(originalUrl)
                .build());

        return new ImageDTO(originalUrl, thumbnailUrl);
    }

    // * 외부 이미지 URL로 업로드
    public ImageDTO uploadImageFromUrl(String imageUrl) throws Exception {
        log.info("🌐 외부 이미지 업로드 요청: {}", imageUrl);

        Files.createDirectories(Paths.get(uploadDir + ORIGINAL_DIR));
        Files.createDirectories(Paths.get(uploadDir + THUMBNAIL_DIR));

        String uuid = UUID.randomUUID().toString();
        String ext = getExtension(imageUrl);
        String fileName = uuid + "." + ext;

        Path originalPath = Paths.get(uploadDir + ORIGINAL_DIR + fileName);
        Path thumbnailPath = Paths.get(uploadDir + THUMBNAIL_DIR + fileName);

        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, originalPath, StandardCopyOption.REPLACE_EXISTING);
        }

        BufferedImage originalImg = ImageIO.read(originalPath.toFile());
        Thumbnails.of(originalImg)
                .size(300, 300)
                .toFile(thumbnailPath.toFile());

        String originalUrl = "/uploads/original/" + fileName;
        String thumbnailUrl = "/uploads/thumbnail/" + fileName;

        imageRepository.save(Image.builder()
                .originalUrl(originalUrl)
                .build());

        return new ImageDTO(originalUrl, thumbnailUrl);
    }

    /**
     * 확장자 추출
     */
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "png";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
