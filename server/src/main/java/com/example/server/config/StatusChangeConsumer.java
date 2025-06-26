package com.example.server.config;

import java.util.List;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.server.dto.FriendEvent;
import com.example.server.dto.StatusChangeEvent;
import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;
import com.example.server.service.FriendService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatusChangeConsumer {

    private final SimpMessagingTemplate messagingTemplate;
    private final FriendService friendService;
    private final MemberRepository memberRepository;

    // 1. Presence 상태 변경 이벤트 처리
    @RabbitListener(queues = "presence.queue")
    public void handleStatusChange(StatusChangeEvent event) {
        List<String> friendEmails = friendService.getFriendEmails(event.getEmail());
        for (String friend : friendEmails) {
            messagingTemplate.convertAndSendToUser(friend, "/queue/status", event);
            log.info("[친구에게 전송] 대상 friendEmail: {}", friend);
        }
    }

    // 2. 친구 요청/수락/삭제 등 이벤트 처리
    @RabbitListener(queues = "#{friendEventQueue.name}")
    public void handleFriendEvent(FriendEvent event) {
        Member target = memberRepository.findById(event.getTargetUserId()).orElse(null);
        if (target == null)
            return;

        messagingTemplate.convertAndSendToUser(
                target.getEmail(),
                "/queue/friend-events",
                event);
    }
}
