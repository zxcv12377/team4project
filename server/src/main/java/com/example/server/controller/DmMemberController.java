package com.example.server.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.DmMemberRequestDTO;
import com.example.server.entity.DmMember;
import com.example.server.service.DmMemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dm-member")
@RequiredArgsConstructor
public class DmMemberController {
    private final DmMemberService dmMemberService;

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody DmMemberRequestDTO request) {
        dmMemberService.joinChatRoom(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/room/{chatRoomId}")
    public ResponseEntity<List<DmMember>> getRoomMembers(@PathVariable Long chatRoomId) {
        return ResponseEntity.ok(dmMemberService.getMembersInRoom(chatRoomId));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<DmMember>> getMemberRooms(@PathVariable Long memberId) {
        return ResponseEntity.ok(dmMemberService.getRoomsForMember(memberId));
    }
}
