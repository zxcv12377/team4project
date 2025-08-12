package com.example.server.listener;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.server.dto.event.ChannelEvent;
import com.example.server.infra.EventPublisher;

import org.springframework.transaction.event.TransactionPhase;

@Component
@RequiredArgsConstructor
public class ChannelEventListener {

    private final EventPublisher eventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onChannelEvent(ChannelEvent event) {
        if (event.getServerId() != null) {
            eventPublisher.publishChannelEvent(event); // 커밋 후 브로드캐스트
        }
    }
}
