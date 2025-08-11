package com.example.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.ChannelBannerUploadDTO;
import com.example.server.service.ChannelBannerService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RequiredArgsConstructor
@RequestMapping("/api/banner/{channelId}")
@RestController
public class ChannelBannerController {

    private final ChannelBannerService service;

    @GetMapping
    public ResponseEntity<ChannelBannerUploadDTO> read(@PathVariable Long channelId) {
        ChannelBannerUploadDTO dto = service.readBanner(channelId);
        return (dto != null) ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PutMapping
    public ResponseEntity<ChannelBannerUploadDTO> upsert(
            @PathVariable Long channelId,
            @RequestBody ChannelBannerUploadDTO req) {
        return ResponseEntity.ok(service.upsertBanner(req, channelId));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable Long channelId) {
        service.deleteBanner(channelId);
        return ResponseEntity.noContent().build();
    }

}
