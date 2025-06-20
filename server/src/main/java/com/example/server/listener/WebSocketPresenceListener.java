package com.example.server.listener;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.example.server.service.UserStatusService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {
    private final @Qualifier("redisTemplate") RedisTemplate<String, String> redis;
    private final SimpMessagingTemplate broker;
    private final UserStatusService userStatusService;

    // 연결 시
    @EventListener
    public void onConnected(SessionConnectedEvent ev) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(ev.getMessage());
        String user = sha.getUser().getName();
        String sessionId = sha.getSessionId();

        userStatusService.markOnline(user, sessionId); // ✅ 위임

    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent ev) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(ev.getMessage());
        if (sha.getUser() == null) {
            log.warn("❌ 사용자 정보 없음. Disconnect 무시");
            return;
        }

        String user = sha.getUser().getName();
        String sessionId = sha.getSessionId();

        userStatusService.markOffline(user, sessionId); // ✅ 위임
    }
}
