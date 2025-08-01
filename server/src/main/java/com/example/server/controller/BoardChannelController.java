package com.example.server.controller;

import com.example.server.dto.BoardChannelDTO;
import com.example.server.service.BoardChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/board-channels")
@RequiredArgsConstructor
public class BoardChannelController {

    private final BoardChannelService channelService;

    /* 1) 목록 */
    @GetMapping
    public ResponseEntity<List<BoardChannelDTO>> list() {
        return ResponseEntity.ok(channelService.list());
    }

    /* 2) 단건 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<BoardChannelDTO> read(@PathVariable Long id) {
        return ResponseEntity.ok(channelService.get(id));
    }

    @GetMapping("/name/{channelName}")
    public BoardChannelDTO readByName(@PathVariable String channelName) {
        return channelService.getByName(channelName);
    }

    /* 3) 생성 */
    @PostMapping
    public ResponseEntity<BoardChannelDTO> create(@RequestBody @Valid BoardChannelDTO dto) {
        BoardChannelDTO saved = channelService.create(dto);
        return ResponseEntity
                .created(URI.create("/api/board-channels/" + saved.getId()))
                .body(saved);
    }

    /* 4) 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<BoardChannelDTO> update(@PathVariable Long id,
            @RequestBody @Valid BoardChannelDTO dto) {
        return ResponseEntity.ok(channelService.update(id, dto));
    }

    /* 5) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        channelService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
