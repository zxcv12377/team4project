package com.example.server.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.entity.VoiceChatLog;
import com.example.server.repository.voiceChat.VoiceChatLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VoiceChatLogService {
    private final VoiceChatLogRepository voiceChatLogRepository;

    public List<VoiceChatLog> list() {
        return voiceChatLogRepository.findAll();
    }

    public List<VoiceChatLog> findRowByChannel(ChatRoom room) {
        return voiceChatLogRepository.findByRoom(room);
    }

    public List<VoiceChatLog> findRowByMember(Member member) {
        return voiceChatLogRepository.findByMember(member);
    }

    public void log(Member member, ChatRoom chatRoom, String action, boolean speaking) {
        VoiceChatLog log = VoiceChatLog.builder()
                .member(member)
                .room(chatRoom)
                .action(action)
                .speaking(speaking)
                .timestamp(LocalDateTime.now())
                .build();

        voiceChatLogRepository.save(log);
    }
}
