package com.example.server.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.VoiceChatLog;
import com.example.server.repository.voiceChat.VoiceChatLogRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class VoiceChatLogController {
    private final VoiceChatLogRepository voiceChatLogRepository;

    @GetMapping("/room")
    public ResponseEntity<List<VoiceChatLog>> getLogsByRoom(@RequestParam Long roomId) {
        ChatRoom room = ChatRoom.builder().id(roomId).build(); // 영속성 없이 참조용
        List<VoiceChatLog> logs = voiceChatLogRepository.findByRoom(room);
        return ResponseEntity.ok(logs);
    }

}
