package com.example.server.controller.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.server.dto.voiceChat.SpeakingStatusRequest;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.service.ChannelMemberService;
import com.example.server.service.VoiceChatLogService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class SpeakingStatusSoketController {
    private final ChannelMemberService memberService;
    private final VoiceChatLogService logService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/voice/speaking-status")
    public void updateSpeakingStatus(SpeakingStatusRequest request) {
        Member member = Member.builder().id(request.getMemberId()).build();
        ChatRoom room = ChatRoom.builder().id(request.getChatRoomlId()).build();
        memberService.updateSpeakingStatus(member, room, request.isSpeaking());

        logService.log(
                member,
                room,
                request.isSpeaking() ? "speak_start" : "speak_stop",
                request.isSpeaking());

        messagingTemplate.convertAndSend(
                "/topic/voice/" + request.getChatRoomlId() + "/speaking", request);
    }
}
