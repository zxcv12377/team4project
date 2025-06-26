package com.example.server.infra;

import java.nio.charset.StandardCharsets;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.server.dto.FriendEvent;
import com.example.server.repository.MemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberRepository memberRepository;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String body = new String(message.getBody(), StandardCharsets.UTF_8);
            FriendEvent event = objectMapper.readValue(body, FriendEvent.class);
            log.info("🔔 수신한 온라인 상태 이벤트: {}", event);

            // targetUserId → username 조회 필요
            String email = memberRepository.findEmailById(event.getTargetUserId());

            messagingTemplate.convertAndSendToUser(
                    email,
                    "/queue/friend",
                    event);

        } catch (Exception e) {
            log.error("친구 이벤트 수신 실패", e);
        }
    }
}