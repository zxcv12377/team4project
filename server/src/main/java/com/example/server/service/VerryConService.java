package com.example.server.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.server.dto.VerryConResponseDTO;
import com.example.server.entity.VerryCon;
import com.example.server.entity.VerryconCategory;
import com.example.server.repository.VerryConRepository;
import com.example.server.repository.VerryconCategoryRepository;
import com.ibm.icu.text.Transliterator;

import jakarta.annotation.PostConstruct;

import java.awt.image.BufferedImage;

import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.io.FilenameUtils;

@Service
@RequiredArgsConstructor
public class VerryConService {
        private final VerryConRepository verryConRepository;
        private final VerryconCategoryRepository categoryRepository;
        private static final Transliterator TL = Transliterator
                        .getInstance("Any-Latin; NFD; [:Nonspacing Mark:] Remove; NFC");

        @Value("${file.upload-dir}")
        private String uploadDir;

        @Value("${con.path-origins}")
        private String pathOrigins;

        private static final int MAX_DIM = 200;

        @PostConstruct
        public void init() {
                System.out.println("📦 ImageIO 플러그인 스캔 중...");
                ImageIO.scanForPlugins(); // 반드시 있어야 WebP 지원 플러그인 로딩됨

                String[] writers = ImageIO.getWriterFormatNames();
                System.out.println("🧩 사용 가능한 writer 포맷: " + Arrays.toString(writers));
        }

        private String toSlug(String text) {
                String latin = TL.transliterate(text); // 한글 → 라틴
                return latin.trim()
                                .toLowerCase()
                                .replaceAll("\\s+", "-") // 공백 → 하이픈
                                .replaceAll("[^a-z0-9-]", ""); // 안전 문자만
        }

        public List<VerryConResponseDTO> getAllVerryCons(String categoryName) {

                return verryConRepository.findAll().stream()
                                .map(a -> new VerryConResponseDTO(
                                                a.getId(),
                                                a.getImagePath(),
                                                a.getVerryconCategory().getName()))
                                .collect(Collectors.toList());
        }

        public List<VerryConResponseDTO> getVerryconByCategory(String categoryName) {
                VerryconCategory category = categoryRepository.findByName(categoryName)
                                .orElseThrow(() -> new IllegalArgumentException("카테고리가 존재하지 않습니다"));

                return verryConRepository.findByVerryconCategory(category).stream()
                                .map(con -> new VerryConResponseDTO(
                                                con.getId(),
                                                con.getImagePath(),
                                                con.getVerryconCategory().getName()))
                                .collect(Collectors.toList());

        }

        private boolean isGif(String filename) {
                String ext = FilenameUtils.getExtension(filename);
                return ext != null && ext.equalsIgnoreCase("gif");
        }

        private void ensureUnderMaxDimForGif(InputStream in) throws IOException {
                // GIF 전체 프레임 크기는 공통이므로 첫 프레임으로 가로/세로 확인
                BufferedImage frame0 = ImageIO.read(in);
                if (frame0 == null)
                        throw new IOException("Invalid GIF");
                if (frame0.getWidth() > MAX_DIM || frame0.getHeight() > MAX_DIM) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "GIF는 200x200 이하만 업로드할 수 있습니다.");
                }
        }

        // 다중 업로드
        public List<VerryConResponseDTO> uploadMultipleVerryCons(String categoryName, List<MultipartFile> files)
                        throws IOException {

                String categorySlug = toSlug(categoryName);
                VerryconCategory category = categoryRepository.findBySlug(categorySlug)
                                .orElseGet(() -> categoryRepository.save(
                                                VerryconCategory.builder().name(categoryName).slug(categorySlug)
                                                                .build()));

                String dir = uploadDir + "/verrycon/" + categorySlug + "/";
                Files.createDirectories(Paths.get(dir));

                List<VerryConResponseDTO> result = new ArrayList<>();

                for (MultipartFile file : files) {
                        String origName = file.getOriginalFilename();
                        if (origName == null) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일명이 없습니다.");
                        }

                        String uuid = UUID.randomUUID().toString();
                        String fileNamePng = uuid + ".png";
                        String fileWebPathPng = pathOrigins + "/uploads/verrycon/" + categorySlug + "/" + fileNamePng;

                        if (isGif(origName)) {
                                // 1) GIF 크기 검증 (200x200 이하)
                                try (InputStream is = file.getInputStream()) {
                                        ensureUnderMaxDimForGif(is);
                                }

                                // 2) GIF 원본 그대로 저장
                                String fileNameGif = uuid + ".gif";
                                Path target = Paths.get(dir, fileNameGif);
                                try (InputStream is = file.getInputStream()) {
                                        Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
                                }

                                String webPathGif = pathOrigins + "/uploads/verrycon/" + categorySlug + "/"
                                                + fileNameGif;

                                VerryCon saved = verryConRepository.save(
                                                VerryCon.builder()
                                                                .verryconCategory(category)
                                                                .imagePath(webPathGif) // GIF 경로 그대로
                                                                .build());

                                result.add(new VerryConResponseDTO(saved.getId(), saved.getImagePath(),
                                                category.getName()));
                                continue;
                        }

                        // ===== PNG/JPG 등 정지 이미지: 200px 이하로 축소 저장 (PNG로 일괄 저장) =====
                        try (InputStream is = file.getInputStream()) {
                                BufferedImage original = ImageIO.read(is);
                                if (original == null) {
                                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                                        "이미지 형식을 인식할 수 없습니다.");
                                }

                                int w = original.getWidth();
                                int h = original.getHeight();

                                BufferedImage output;
                                if (w <= MAX_DIM && h <= MAX_DIM) {
                                        // 이미 200 이하면 그대로 PNG로만 재인코딩
                                        output = original;
                                } else {
                                        // 긴 변 기준 200으로 축소 (비율 유지)
                                        output = Thumbnails.of(original)
                                                        .size(MAX_DIM, MAX_DIM) // 긴 변 200
                                                        .keepAspectRatio(true)
                                                        .asBufferedImage();
                                }

                                File outFile = new File(dir + fileNamePng);
                                ImageIO.write(output, "png", outFile);
                        }

                        VerryCon saved = verryConRepository.save(
                                        VerryCon.builder()
                                                        .verryconCategory(category)
                                                        .imagePath(fileWebPathPng) // PNG 경로
                                                        .build());

                        result.add(new VerryConResponseDTO(saved.getId(), saved.getImagePath(), category.getName()));
                }

                return result;
        }
}
// // 단일 업로드
// public VerryConResponseDTO uploadVerryCon(String name, MultipartFile file)
// throws IOException {
// // 파일명 및 경로 준비
// String uuid = UUID.randomUUID().toString();
// String fileName = uuid + ".png";
// String dirPath = uploadDir + "/verrycon/";
// String webPath = "/uploads/verrycon/" + fileName;

// Files.createDirectories(Paths.get(dirPath));
// File outputFile = new File(dirPath + fileName);

// // 이미지 리사이징 (100x100)
// BufferedImage originalImage = ImageIO.read(file.getInputStream());
// BufferedImage resized = Thumbnails.of(originalImage)
// .size(100, 100)
// .asBufferedImage();

// // png 저장 (ImageWriter 직접 사용)
// Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
// if (!writers.hasNext()) {
// throw new IllegalStateException("❌ png writer를 찾을 수 없습니다.");
// }

// ImageWriter writer = writers.next();
// try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputFile)) {
// writer.setOutput(ios);
// writer.write(resized);
// }
// writer.dispose();

// System.out.println("✅ png 저장 성공: " + outputFile.getAbsolutePath());

// // DB 저장
// VerryCon verryCon = verryConRepository.save(VerryCon.builder()
// .name(name)
// .imagePath(webPath)
// .build());

// return new VerryConResponseDTO(verryCon.getId(), verryCon.getName(),
// verryCon.getImagePath());
// }