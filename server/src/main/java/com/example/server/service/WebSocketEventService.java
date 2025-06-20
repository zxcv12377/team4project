package com.example.server.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.server.dto.WebSocketMessageDTO;
import com.example.server.entity.enums.WebSocketMessageType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {
    private final SimpMessagingTemplate messagingTemplate;

    // 사용자 상태 변경 이벤트 발행
    public void publishUserStatus(String email, String status) {
        WebSocketMessageDTO message = new WebSocketMessageDTO(
                WebSocketMessageType.USER_STATUS,
                email,
                Map.of("status", status),
                LocalDateTime.now(),
                null);
        messagingTemplate.convertAndSend("/topic/user." + email, message);
    }

    // 게시판 이벤트 발행
    public void publishBoardEvent(Long boardId, String eventType, Object payload) {
        WebSocketMessageDTO message = new WebSocketMessageDTO(
                WebSocketMessageType.BOARD_EVENT,
                null,
                payload,
                LocalDateTime.now(),
                Map.of("boardId", boardId, "eventType", eventType));
        messagingTemplate.convertAndSend("/topic/board." + boardId, message);
    }

    // 알림 발행
    public void publishNotification(String email, String notificationType, Object payload) {
        WebSocketMessageDTO message = new WebSocketMessageDTO(
                WebSocketMessageType.NOTIFICATION,
                null,
                payload,
                LocalDateTime.now(),
                Map.of("notificationType", notificationType));
        messagingTemplate.convertAndSend("/user/queue/notifications." + email, message);
    }
}
