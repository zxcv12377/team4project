package com.example.server.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.VerryConResponseDTO;
import com.example.server.entity.VerryCon;
import com.example.server.repository.VerryConRepository;

import jakarta.annotation.PostConstruct;

import java.awt.image.BufferedImage;

import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;

@Service
@RequiredArgsConstructor
public class VerryConService {
        private final VerryConRepository verryConRepository;

        @Value("${file.upload-dir}")
        private String uploadDir;

        @PostConstruct
        public void init() {
                System.out.println("📦 ImageIO 플러그인 스캔 중...");
                ImageIO.scanForPlugins(); // 반드시 있어야 WebP 지원 플러그인 로딩됨

                String[] writers = ImageIO.getWriterFormatNames();
                System.out.println("🧩 사용 가능한 writer 포맷: " + Arrays.toString(writers));
        }

        public List<VerryConResponseDTO> getAllVerryCons() {
                return verryConRepository.findAll().stream()
                                .map(a -> new VerryConResponseDTO(
                                                a.getId(),
                                                a.getName(),
                                                a.getImagePath()))
                                .collect(Collectors.toList());
        }

        public VerryConResponseDTO uploadVerryCon(String name, MultipartFile file) throws IOException {
                // 파일명 및 경로 준비
                String uuid = UUID.randomUUID().toString();
                String fileName = uuid + ".png";
                String dirPath = uploadDir + "/verrycon/";
                String webPath = "/uploads/verrycon/" + fileName;

                Files.createDirectories(Paths.get(dirPath));
                File outputFile = new File(dirPath + fileName);

                // 이미지 리사이징 (100x100)
                BufferedImage originalImage = ImageIO.read(file.getInputStream());
                BufferedImage resized = Thumbnails.of(originalImage)
                                .size(100, 100)
                                .asBufferedImage();

                // png 저장 (ImageWriter 직접 사용)
                Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
                if (!writers.hasNext()) {
                        throw new IllegalStateException("❌ png writer를 찾을 수 없습니다.");
                }

                ImageWriter writer = writers.next();
                try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputFile)) {
                        writer.setOutput(ios);
                        writer.write(resized);
                }
                writer.dispose();

                System.out.println("✅ png 저장 성공: " + outputFile.getAbsolutePath());

                // DB 저장
                VerryCon verryCon = verryConRepository.save(VerryCon.builder()
                                .name(name)
                                .imagePath(webPath)
                                .build());

                return new VerryConResponseDTO(verryCon.getId(), verryCon.getName(), verryCon.getImagePath());
        }
}
