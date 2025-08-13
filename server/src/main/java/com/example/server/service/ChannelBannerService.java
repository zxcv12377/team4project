package com.example.server.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.ChannelBannerUploadDTO;
import com.example.server.entity.BoardChannel;
import com.example.server.entity.ChannelBanner;
import com.example.server.repository.BoardChannelRepository;
import com.example.server.repository.ChannelBannerRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RequiredArgsConstructor
@Service
public class ChannelBannerService {

    private final ChannelBannerRepository channelBannerRepository;
    private final BoardChannelRepository boardChannelRepository;

    @Value("${file.upload-dir}")
    private Path base;

    public String save(MultipartFile file, String dir) throws IOException {
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse(".bin");
        String uuid = java.util.UUID.randomUUID().toString().replace("-", "");
        Path targetDir = (dir == null || dir.isBlank())
                ? base
                : base.resolve(dir).normalize();
        Files.createDirectories(targetDir);
        Path target = targetDir.resolve(uuid + ext);
        try (var in = file.getInputStream()) {
            Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
        // 브라우저에서 접근 가능한 경로 반환 (Nginx alias or Spring 정적 매핑 기준)
        String publicPath = "/uploads/" + (dir == null || dir.isBlank() ? "" : (dir + "/")) + uuid + ext;
        return publicPath;
    }

    @Transactional(readOnly = true)
    public ChannelBannerUploadDTO readBanner(Long channelId) {
        ChannelBanner banner = channelBannerRepository.findByBoardChannelId(channelId)
                .orElse(null);

        if (banner == null) {
            return null; // 혹은 기본 이미지를 리턴하도록 처리
        }

        return ChannelBannerUploadDTO.builder()
                .id(banner.getId())
                .paths(banner.getPath())
                .channelId(channelId)
                .build();
    }

    @Transactional
    public void deleteBanner(Long channelId) {
        channelBannerRepository.deleteByBoardChannelId(channelId);
    }

    @Transactional
    public ChannelBannerUploadDTO upsertBanner(ChannelBannerUploadDTO dto, Long channelId) {
        BoardChannel channel = boardChannelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("채널을 찾을 수 없습니다. id=" + channelId));

        ChannelBanner banner = channelBannerRepository.findByBoardChannelId(channelId)
                .orElseGet(() -> ChannelBanner.builder()
                        .boardChannel(channel)
                        .build());

        banner.changePath(dto.getPaths());

        ChannelBanner saved = channelBannerRepository.save(banner);

        return ChannelBannerUploadDTO.builder()
                .id(saved.getId())
                .paths(saved.getPath())
                .channelId(channelId)
                .build();
    }
}
