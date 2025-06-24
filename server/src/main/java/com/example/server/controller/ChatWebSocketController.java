package com.example.server.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.example.server.dto.ChatMessageDTO;
import com.example.server.entity.ChatMessageEntity;
import com.example.server.jwt.JwtUtil;
import com.example.server.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtUtil jwtTokenProvider;

    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,
            @Payload ChatMessageDTO dto,
            SimpMessageHeaderAccessor headerAccessor) {

        // WebSocket 세션에서 사용자 정보 가져오기
        String email = (String) headerAccessor.getSessionAttributes().get("email");
        String nickname = (String) headerAccessor.getSessionAttributes().get("nickname");
        log.warn("헤더 전체 출력: {}", headerAccessor.getSessionAttributes());
        log.warn("💬 세션에서 꺼낸 사용자정보 email={}, nickname={}", email, nickname);

        // 메시지 DB에 저장
        chatMessageService.handleMessage(roomId, dto.getMessage(), email);

        // WebSocket 응답용 DTO 생성
        ChatMessageDTO responseMessage = new ChatMessageDTO();
        responseMessage.setRoomId(roomId);
        responseMessage.setSender(nickname);
        responseMessage.setMessage(dto.getMessage());
        responseMessage.setType("CHAT");

        log.info("💬 [{}] {}: {}", roomId, nickname, dto.getMessage());

        // 명시적으로 동적 경로로 메시지 전송
        messagingTemplate.convertAndSend("/topic/chatroom." + roomId, responseMessage);
    }

    @MessageMapping("/auth")
    public void authenticate(@Payload Map<String, String> payload, StompHeaderAccessor accessor) {
        log.warn("🟢 authenticate 메서드 호출됨");
        String token = payload.get("token");
        if (token != null && jwtTokenProvider.isTokenValid(token)) {
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            accessor.setUser(auth);
            accessor.getSessionAttributes().put("email", auth.getName());
            log.warn("🟢 인증 성공, email: {}", auth.getName());
        } else {
            log.warn("❌ 인증 실패");
        }
    }

    // 소켓 유지용 핑 엔드(단방향)
    @MessageMapping("/ping")
    public void handlePing(Principal principal) {
        log.debug("📡 Ping received from {}", principal.getName());
    }

}