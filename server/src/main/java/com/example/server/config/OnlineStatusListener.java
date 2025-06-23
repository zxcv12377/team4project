package com.example.server.config;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.server.dto.StatusChangeEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class OnlineStatusListener {
    private final SimpMessagingTemplate simpMessagingTemplate;

    @RabbitListener(queues = "presence.queue")
    public void handleStatusChange(StatusChangeEvent event) {
        log.info("📡 Received status event: {}", event);

        // 🔥 WebSocket STOMP 구독자에게 직접 전송
        simpMessagingTemplate.convertAndSend("/topic/online-users", event);
    }
}
