package com.example.server.controller;

import com.example.server.dto.ImageDTO;
import com.example.server.dto.ImageUrlRequest;
import com.example.server.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/images")
public class ImageController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ImageDTO> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            ImageDTO imageDTO = fileStorageService.saveImage(file);
            return ResponseEntity.ok(imageDTO);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload/url")
    public ResponseEntity<ImageDTO> uploadImageByUrl(@RequestBody ImageUrlRequest request) {
        try {
            ImageDTO imageDTO = fileStorageService.saveImageFromUrl(request.getUrl());
            return ResponseEntity.ok(imageDTO);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
