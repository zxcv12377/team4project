package com.example.server.infra;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.server.dto.FriendEvent;
import com.example.server.dto.StatusChangeEvent;
import com.example.server.dto.event.ChannelEvent;
import com.example.server.dto.event.ServerMemberEvent;
import com.example.server.entity.enums.RedisChannelConstants;
import com.example.server.entity.enums.UserStatus;

@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Qualifier("EventRedisTemplate")
    private final RedisTemplate<String, Object> redisTemplate;

    public void publishOnline(String Email, Iterable<String> friendEmails) {
        StatusChangeEvent event = new StatusChangeEvent(Email, UserStatus.ONLINE);
        redisTemplate.convertAndSend("status.change", event);
        messagingTemplate.convertAndSend("/topic/online-users", event);
        for (String friend : friendEmails) {
            messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                    Map.of("Email", Email, "status", "ONLINE"));
        }
    }

    public void publishOffline(String Email, Iterable<String> friendEmails) {
        StatusChangeEvent event = new StatusChangeEvent(Email, UserStatus.OFFLINE);
        redisTemplate.convertAndSend("status.change", event);
        messagingTemplate.convertAndSend("/topic/online-users", event);
        for (String friend : friendEmails) {
            messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                    Map.of("Email", Email, "status", "OFFLINE"));
        }
    }

    public void publishFriendEvent(FriendEvent event, String username) {
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, event);
        messagingTemplate.convertAndSendToUser(username, "/queue/friend", event);
    }

    public void publishServerMemberEvent(ServerMemberEvent event) {
        redisTemplate.convertAndSend(RedisChannelConstants.SERVER_MEMBER_CHANGE, event);
        // WebSocket으로 참여자에게 실시간 전송
        messagingTemplate.convertAndSend(
                "/topic/server." + event.getServerId() + ".members",
                event);
    }

    public void publishServerChange(Object event, Long targetUserId) {
        redisTemplate.convertAndSend(RedisChannelConstants.SERVER_CHANGE, event);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(targetUserId),
                "/queue/server-list",
                event);
    }

    public void publishInviteEvent(Object event, Long targetUserId) {
        redisTemplate.convertAndSend(RedisChannelConstants.INVITE_CHANGE, event);
    }

    public void publishChannelEvent(ChannelEvent event) {
        redisTemplate.convertAndSend(RedisChannelConstants.CHANNEL_CHANGE, event);
        messagingTemplate.convertAndSend("/topic/server." + event.getServerId() + ".channels", event);
    }
}