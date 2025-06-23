package com.example.server.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.example.server.config.RabbitMQConfig;
import com.example.server.dto.StatusChangeEvent;
import com.example.server.entity.enums.UserStatus;

@Component
public class EventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishOnline(String email) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PRESENCE_EXCHANGE,
                "",
                new StatusChangeEvent(email, UserStatus.ONLINE));
    }

    public void publishOffline(String email) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PRESENCE_EXCHANGE,
                "",
                new StatusChangeEvent(email, UserStatus.OFFLINE));
    }
}
