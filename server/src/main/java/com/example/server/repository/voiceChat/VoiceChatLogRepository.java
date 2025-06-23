package com.example.server.repository.voiceChat;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.entity.VoiceChatLog;

import java.util.List;

public interface VoiceChatLogRepository extends JpaRepository<VoiceChatLog, Long> {

    List<VoiceChatLog> findByRoom(ChatRoom room);

    List<VoiceChatLog> findByMember(Member member);
}
