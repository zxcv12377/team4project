package com.example.server.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.VerryConResponseDTO;
import com.example.server.service.VerryConService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/verrycons")
public class VerryConController {
    private final VerryConService verryConService;

    @GetMapping
    public ResponseEntity<List<VerryConResponseDTO>> list(
            @RequestParam(value = "category", required = false) String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return ResponseEntity.ok(verryConService.getAllVerryCons(null));
        } else {
            return ResponseEntity.ok(verryConService.getVerryconByCategory(categoryName));
        }
    }

    @GetMapping("/")
    public List<VerryConResponseDTO> getVerry(@RequestParam("categoryName") String categoryName) {

        return verryConService.getVerryconByCategory(categoryName);
    }

    @PostMapping("/upload-multiple")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadMultipleVerryCons(
            @RequestParam("categoryName") String categoryName,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            List<VerryConResponseDTO> savedFiles = verryConService.uploadMultipleVerryCons(categoryName, files);
            return ResponseEntity.ok(savedFiles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VerryConResponseDTO> update(
            @PathVariable Long id,
            @RequestParam(value = "categoryName", required = false) String categoryName,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        return ResponseEntity.ok(verryConService.updateVerryCon(id, categoryName, file));
    }

    // 삭제
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws IOException {
        verryConService.deleteVerryCon(id);
        return ResponseEntity.noContent().build();
    }

    // (선택) 카테고리 일괄 삭제
    @DeleteMapping("/category")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteByCategory(@RequestParam String categoryName) throws IOException {
        int count = verryConService.deleteByCategory(categoryName);
        return ResponseEntity.ok(Map.of("deleted", count));
    }
}

// @PostMapping("/upload")
// @PreAuthorize("hasRole('ADMIN')") // Spring Security에서 관리자 권한 제한
// public ResponseEntity<?> uploadAkakon(
// @RequestParam("name") String name,
// @RequestParam("file") MultipartFile file) {
// try {
// VerryConResponseDTO saved = verryConService.uploadVerryCon(name, file);
// return ResponseEntity.ok(saved);
// } catch (Exception e) {
// return ResponseEntity.badRequest().body("업로드 실패: " + e.getMessage());
// }
// }