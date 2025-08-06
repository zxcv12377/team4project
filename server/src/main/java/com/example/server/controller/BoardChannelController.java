package com.example.server.controller;

import com.example.server.dto.BoardChannelDTO;
import com.example.server.service.BoardChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/board-channels")
@RequiredArgsConstructor
public class BoardChannelController {

    private final BoardChannelService channelService;

    // 전체 조회
    @GetMapping
    public ResponseEntity<List<BoardChannelDTO>> list() {
        return ResponseEntity.ok(channelService.list());
    }

    // 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<BoardChannelDTO> read(@PathVariable Long id) {
        return ResponseEntity.ok(channelService.get(id));
    }

    // 이름으로 조회
    @GetMapping("/name/{channelName}")
    public BoardChannelDTO readByName(@PathVariable String channelName) {
        return channelService.getByName(channelName);
    }

    // 생성
    @PostMapping
    public ResponseEntity<BoardChannelDTO> create(@RequestBody @Valid BoardChannelDTO dto) {
        BoardChannelDTO saved = channelService.create(dto);
        return ResponseEntity
                .created(URI.create("/api/board-channels/" + saved.getId()))
                .body(saved);
    }

    // 수정
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<BoardChannelDTO> update(@PathVariable Long id,
            @RequestBody @Valid BoardChannelDTO dto) {
        return ResponseEntity.ok(channelService.update(id, dto));
    }

    // 삭제
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        channelService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
