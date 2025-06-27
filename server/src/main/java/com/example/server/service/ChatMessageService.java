package com.example.server.service;

import com.example.server.entity.ChatMessageEntity;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.repository.ChatMessageRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

        private final ChatMessageRepository chatMessageRepository;
        private final MemberRepository memberRepository;
        private final ChatRoomRepository chatRoomRepository;

        // 채팅방 메시지 조회
        public List<ChatMessageEntity> getMessagesByRoomId(Long roomId) {
                ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));
                return chatMessageRepository.findByRoomOrderBySentAtAsc(chatRoom);

        }

        public void handleMessage(Long roomId, String message, String email) {
                // DB에 저장
                Member sender = memberRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

                ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));

                ChatMessageEntity chatMessage = ChatMessageEntity.builder()
                                .room(chatRoom)
                                .message(message)
                                .sentAt(LocalDateTime.now())
                                .sender(sender)
                                .build();
                chatMessageRepository.save(chatMessage);

        }
}
