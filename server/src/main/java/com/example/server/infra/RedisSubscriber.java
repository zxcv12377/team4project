package com.example.server.infra;

import java.nio.charset.StandardCharsets;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.server.dto.FriendEvent;
import com.example.server.dto.StatusChangeEvent;
import com.example.server.dto.event.ServerMemberEvent;
import com.example.server.entity.enums.RedisChannelConstants;
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
            String channel = new String(message.getChannel(), StandardCharsets.UTF_8);
            String body = new String(message.getBody(), StandardCharsets.UTF_8);

            if (RedisChannelConstants.FRIEND_REQUEST_CHANNEL.equals(channel)) {
                FriendEvent event = objectMapper.readValue(body, FriendEvent.class);
                log.info("🔔 친구 요청 수신: {}", event);
                String username = memberRepository.findEmailById(event.getTargetUserId());
                messagingTemplate.convertAndSendToUser(username, "/queue/friend", event);

            } else if (RedisChannelConstants.SERVER_MEMBER_CHANGE.equals(channel)) {
                ServerMemberEvent event = objectMapper.readValue(body, ServerMemberEvent.class);
                log.info("📡 서버 멤버 변경 수신: {}", event);
                messagingTemplate.convertAndSend(
                        "/topic/server." + event.getServerId() + ".members", event);

            } else if ("status.change".equals(channel)) {
                StatusChangeEvent event = objectMapper.readValue(body, StatusChangeEvent.class);
                log.info("🟢 상태 변경 수신: {}", event);
                messagingTemplate.convertAndSend("/topic/online-users", event);
            }

        } catch (Exception e) {
            log.error("❌ Redis 메시지 수신 처리 중 오류 발생", e);
        }
    }
}