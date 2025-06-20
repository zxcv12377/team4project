package com.example.server.controller;

import com.example.server.dto.ChatRoomResponseDTO;
import com.example.server.dto.ServerRequestDTO;
import com.example.server.dto.ServerResponseDTO;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.ServerService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;

    // 전체 서버 검색용
    @GetMapping
    public ResponseEntity<List<ServerResponseDTO>> getServerList(
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal CustomMemberDetails member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ServerResponseDTO> list = serverService.searchServers(keyword);
        return ResponseEntity.ok(list);
    }

    // 내가 참여한 서버
    @GetMapping("/my")
    public ResponseEntity<List<ServerResponseDTO>> getMyServers(
            @AuthenticationPrincipal CustomMemberDetails member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ServerResponseDTO> list = serverService.getAllServers(member.getId());
        return ResponseEntity.ok(list);
    }

    // 서버 개설
    @PostMapping
    public ResponseEntity<ServerResponseDTO> createServer(
            @AuthenticationPrincipal CustomMemberDetails member,
            @RequestBody ServerRequestDTO req) {
        if (member == null) {
            // 인증 안 된 유저 거부
            return ResponseEntity.status(401).build();
        }
        // 필요한 추가 검증(이메일 인증 등) 있으면 여기에
        ServerResponseDTO result = serverService.createServer(req, member.getId());
        return ResponseEntity.ok(result);
    }

    // 서버 참여
    @PostMapping("/{serverId}/join")
    public ResponseEntity<Void> joinServer(
            @AuthenticationPrincipal CustomMemberDetails member,
            @PathVariable Long serverId) {
        if (member == null)
            return ResponseEntity.status(401).build();
        serverService.joinServer(serverId, member.getId());
        return ResponseEntity.ok().build();
    }

    // 서버 삭제
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @AuthenticationPrincipal CustomMemberDetails member,
            @PathVariable Long serverId) {
        if (member == null)
            return ResponseEntity.status(401).build();
        serverService.deleteServer(serverId, member.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{serverId}/channels")
    public ResponseEntity<List<ChatRoomResponseDTO>> getChannelsByServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal CustomMemberDetails member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ChatRoomResponseDTO> list = serverService.getChannelsByServer(serverId);
        return ResponseEntity.ok(list);
    }

}
