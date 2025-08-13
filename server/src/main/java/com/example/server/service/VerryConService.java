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

import io.micrometer.common.lang.Nullable;
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

        /** /uploads/ 이후의 상대경로를 디스크 경로로 변환 */
        private Path webPathToDiskPath(String webPath) {
                int idx = webPath.indexOf("/uploads/");
                if (idx < 0)
                        throw new IllegalArgumentException("웹 경로가 올바르지 않습니다: " + webPath);
                String relative = webPath.substring(idx + "/uploads/".length());
                return Paths.get(uploadDir, relative.replace("/", File.separator));
        }

        /** 상대경로(uploads 이하)를 웹 경로로 변환 */
        private String buildWebPath(String relativePath) {
                return pathOrigins + "/uploads/" + relativePath.replace(File.separator, "/");
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

        public VerryConResponseDTO updateVerryCon(Long id, @Nullable String newCategoryName,
                        @Nullable MultipartFile newFile)
                        throws IOException {

                VerryCon con = verryConRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "베리콘을 찾을 수 없습니다."));

                // 현재 파일/확장자
                String oldWebPath = con.getImagePath();
                Path oldDiskPath = webPathToDiskPath(oldWebPath);
                String oldFileName = oldDiskPath.getFileName().toString(); // uuid.ext
                String ext = FilenameUtils.getExtension(oldFileName); // png or gif

                // 목표 카테고리 확정
                VerryconCategory targetCategory = con.getVerryconCategory();
                String targetSlug = targetCategory.getSlug();
                String targetCategoryDisplayName = targetCategory.getName();

                if (newCategoryName != null && !newCategoryName.isBlank()) {
                        String slug = toSlug(newCategoryName);
                        targetCategory = categoryRepository.findBySlug(slug)
                                        .orElseGet(() -> categoryRepository.save(
                                                        VerryconCategory.builder().name(newCategoryName).slug(slug)
                                                                        .build()));
                        targetSlug = targetCategory.getSlug();
                        targetCategoryDisplayName = targetCategory.getName();
                }

                // 새 파일이 들어온 경우엔 "업로드 로직"을 재사용해 교체 저장
                if (newFile != null && !newFile.isEmpty()) {
                        String uuid = UUID.randomUUID().toString();

                        // GIF 업로드이면 사이즈 검증 후 .gif로, 아니면 200px 이하로 png 저장
                        if (isGif(newFile.getOriginalFilename())) {
                                try (InputStream is = newFile.getInputStream()) {
                                        ensureUnderMaxDimForGif(is);
                                }

                                String newName = uuid + ".gif";
                                Path newDir = Paths.get(uploadDir, "verrycon", targetSlug);
                                Files.createDirectories(newDir);
                                Path newDiskPath = newDir.resolve(newName);

                                try (InputStream is = newFile.getInputStream()) {
                                        Files.copy(is, newDiskPath, StandardCopyOption.REPLACE_EXISTING);
                                }

                                // DB 업데이트
                                String newWebPath = buildWebPath("verrycon/" + targetSlug + "/" + newName);
                                con.changeVerryconCategory(targetCategory);
                                con.changeImagePath(newWebPath);

                                // 기존 파일 삭제
                                Files.deleteIfExists(oldDiskPath);
                        } else {
                                // 정지 이미지 → PNG로 리사이즈 저장
                                BufferedImage output;
                                try (InputStream is = newFile.getInputStream()) {
                                        BufferedImage original = ImageIO.read(is);
                                        if (original == null)
                                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                                                "이미지 형식을 인식할 수 없습니다.");

                                        int w = original.getWidth(), h = original.getHeight();
                                        if (w <= MAX_DIM && h <= MAX_DIM) {
                                                output = original;
                                        } else {
                                                output = Thumbnails.of(original).size(MAX_DIM, MAX_DIM)
                                                                .keepAspectRatio(true).asBufferedImage();
                                        }
                                }

                                String newName = uuid + ".png";
                                Path newDir = Paths.get(uploadDir, "verrycon", targetSlug);
                                Files.createDirectories(newDir);
                                File outFile = newDir.resolve(newName).toFile();
                                ImageIO.write(output, "png", outFile);

                                String newWebPath = buildWebPath("verrycon/" + targetSlug + "/" + newName);
                                con.changeVerryconCategory(targetCategory);
                                con.changeImagePath(newWebPath);

                                // 기존 파일 삭제
                                Files.deleteIfExists(oldDiskPath);
                        }
                } else if (!targetSlug.equals(con.getVerryconCategory().getSlug())) {
                        // 파일은 그대로 두고 카테고리만 바뀐 경우 → 파일 이동
                        Path newDir = Paths.get(uploadDir, "verrycon", targetSlug);
                        Files.createDirectories(newDir);

                        String newName = oldFileName; // 파일명 유지 (uuid.ext)
                        Path newDiskPath = newDir.resolve(newName);

                        // 충돌 시 uuid 새로
                        if (Files.exists(newDiskPath)) {
                                String uuid = UUID.randomUUID().toString();
                                newName = uuid + "." + ext;
                                newDiskPath = newDir.resolve(newName);
                        }

                        Files.createDirectories(newDiskPath.getParent());
                        Files.move(oldDiskPath, newDiskPath, StandardCopyOption.REPLACE_EXISTING);

                        String newWebPath = buildWebPath("verrycon/" + targetSlug + "/" + newName);
                        con.changeVerryconCategory(targetCategory);
                        con.changeImagePath(newWebPath);
                }

                VerryCon saved = verryConRepository.save(con);
                return new VerryConResponseDTO(saved.getId(), saved.getImagePath(), targetCategoryDisplayName);
        }

        // ====== 삭제 ======
        public void deleteVerryCon(Long id) throws IOException {
                VerryCon con = verryConRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "베리콘을 찾을 수 없습니다."));

                // 파일 먼저 정리(실패해도 DB 삭제는 진행)
                try {
                        Path diskPath = webPathToDiskPath(con.getImagePath());
                        Files.deleteIfExists(diskPath);
                } catch (Exception e) {
                        // 로그만 남기고 계속
                        System.err.println("파일 삭제 실패: " + e.getMessage());
                }

                verryConRepository.delete(con);
        }

        // ====== (선택) 카테고리 일괄 삭제 ======
        public int deleteByCategory(String categoryName) throws IOException {
                VerryconCategory category = categoryRepository.findByName(categoryName)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "카테고리가 존재하지 않습니다."));
                List<VerryCon> list = verryConRepository.findByVerryconCategory(category);

                int count = 0;
                for (VerryCon con : list) {
                        try {
                                Files.deleteIfExists(webPathToDiskPath(con.getImagePath()));
                        } catch (Exception e) {
                                /* ignore */ }
                        verryConRepository.delete(con);
                        count++;
                }
                // 비어있으면 폴더도 정리(필요 시)
                Path dir = Paths.get(uploadDir, "verrycon", category.getSlug());
                try {
                        Files.delete(dir);
                } catch (Exception ignore) {
                }
                return count;
        }
}