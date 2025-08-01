package com.example.server.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ChatMessageResponseDTO;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.ChatMessageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping("/{roomId}")
    public List<ChatMessageResponseDTO> getMessages(@PathVariable Long roomId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        Long memberId = principal.getId();
        return chatMessageService.getMessagesByRoomId(roomId, memberId)
                .stream()
                .map(ChatMessageResponseDTO::from)
                .toList();
    }

}
