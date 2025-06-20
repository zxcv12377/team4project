package com.example.server.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ChannelMemberResponseDTO;
import com.example.server.entity.ChannelMember;
import com.example.server.entity.ChannelRole;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.ChannelMemberService;
import com.example.server.service.VoiceChatLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/channel-members")
@RequiredArgsConstructor
public class ChannelMemberController {

    private final ChannelMemberService channelMemberService;
    private final VoiceChatLogService logService;

    // 채널 참여 (입장)
    @PostMapping("/join")
    public ChannelMember joinChannel(
            @AuthenticationPrincipal CustomMemberDetails member, // JWT 인증 유저
            @RequestBody Map<String, Object> req) {
        Long roomId = Long.valueOf(req.get("roomId").toString());
        ChatRoom room = ChatRoom.builder().id(roomId).build();
        Member mem = Member.builder().id(member.getId()).build();
        ChannelRole role = ChannelRole.USER; // 일반 사용자는 USER로 고정
        logService.log(mem, room, "join", false);
        return channelMemberService.joinChannel(member.getId(), roomId, role);
    }

    @PostMapping("/leave")
    public void leaveChannel(
            @AuthenticationPrincipal CustomMemberDetails member, // JWT 인증 유저
            @RequestBody Map<String, Object> req) {
        Long roomId = Long.valueOf(req.get("roomId").toString());
        ChatRoom room = ChatRoom.builder().id(roomId).build();
        Member mem = Member.builder().id(member.getId()).build();
        logService.log(mem, room, "leave", false);
        channelMemberService.leaveChannel(mem, room);
    }

    // 채널별 참여자 목록 조회
    @GetMapping("/room/{roomId}")
    public List<ChannelMemberResponseDTO> listMembers(@PathVariable Long roomId) {
        return channelMemberService.listMembers(roomId);
    }
}
