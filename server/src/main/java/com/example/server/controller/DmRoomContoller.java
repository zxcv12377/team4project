package com.example.server.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ChatRoomResponseDTO;
import com.example.server.dto.DmRoomRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.mapper.MemberMapper;
import com.example.server.service.DmRoomService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DmRoomContoller {
    private final DmRoomService dmRoomService;

    // 1:1 DM방 생성 또는 조회
    @PostMapping("/room")
    public ChatRoomResponseDTO createOrGetDmRoom(@RequestBody DmRoomRequestDTO request) {
        log.info("📦 DM 요청 도착 - myId: {}, friendId: {}", request.getMyId(), request.getFriendId());
        ChatRoom room = dmRoomService.getOrCreateDmRoom(request.getMyId(), request.getFriendId());
        return ChatRoomResponseDTO.from(room);
    }

    // 내가 속한 DM방 리스트
    @GetMapping("/rooms/{memberId}")
    public List<ChatRoomResponseDTO> getMyDmRooms(@PathVariable Long memberId) {
        return dmRoomService.findMyDmRooms(memberId);
    }

    // DM방 참여자 리스트
    @GetMapping("/room/{roomId}/members")
    public List<MemberResponseDTO> getMembers(@PathVariable Long roomId) {
        List<Member> members = dmRoomService.getMembers(roomId);
        return members.stream().map(MemberMapper::toDTO).toList();
    }
}
