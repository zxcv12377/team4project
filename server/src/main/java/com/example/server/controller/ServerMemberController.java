package com.example.server.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ServerMemberResponseDTO;
import com.example.server.entity.ServerRole;
import com.example.server.service.ServerMemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/servers/{serverId}/members")
@RequiredArgsConstructor
public class ServerMemberController {
    private final ServerMemberService serverMemberService;

    // 서버 참여자 목록 조회
    @GetMapping
    public ResponseEntity<List<ServerMemberResponseDTO>> getServerMembers(@PathVariable Long serverId) {
        return ResponseEntity.ok(serverMemberService.getServerMembers(serverId));
    }

    // 서버에 참여 (추가)
    @PostMapping("/{memberId}")
    public ResponseEntity<Void> joinServer(
            @PathVariable Long serverId,
            @PathVariable Long memberId) {
        serverMemberService.joinServer(serverId, memberId);
        return ResponseEntity.ok().build();
    }

    // 강퇴
    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeServerMember(
            @PathVariable Long serverId,
            @PathVariable Long memberId) {
        serverMemberService.removeServerMember(serverId, memberId);
        return ResponseEntity.ok().build();
    }

    // 권한 변경
    @PatchMapping("/{memberId}/role")
    public ResponseEntity<Void> changeServerMemberRole(
            @PathVariable Long serverId,
            @PathVariable Long memberId,
            @RequestBody String newRole // "ADMIN", "USER" 등
    ) {
        serverMemberService.changeServerMemberRole(serverId, memberId, ServerRole.valueOf(newRole));
        return ResponseEntity.ok().build();
    }

    // (선택) 참여자 권한 조회
    @GetMapping("/{memberId}/role")
    public ResponseEntity<String> getMemberRole(
            @PathVariable Long serverId,
            @PathVariable Long memberId) {
        String role = serverMemberService.getMemberRole(serverId, memberId);
        if (role == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(role);
    }
}
