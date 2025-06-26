package com.example.server.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.server.dto.StatusChangeEvent;
import com.example.server.entity.FriendStatus;
import com.example.server.entity.enums.UserStatus;
import com.example.server.messaging.EventPublisher;
import com.example.server.repository.FriendRepository;
import com.example.server.repository.MemberRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatusService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;

    public void markOnline(String email, String sessionId) {
        String sessionKey = "user:" + email + ":sessions";

        Set<String> oldSessions = redisTemplate.opsForSet().members(sessionKey);
        if (oldSessions != null) {
            for (String oldSession : oldSessions) {
                redisTemplate.opsForSet().remove(sessionKey, oldSession);
                log.info("♻️ 재연결: 이전 세션 {} 제거됨", oldSession);
            }
        }

        redisTemplate.opsForSet().add(sessionKey, sessionId);
        redisTemplate.opsForSet().add("online_users", email);
        log.info("✅ 최종 세션 등록: user={}, sessionId={}", email, sessionId);

        if (oldSessions == null || oldSessions.isEmpty()) {
            eventPublisher.publishOnline(email);

            List<String> friends = getFriendemails(email);
            for (String friend : friends) {
                log.info("📡 친구 [{}] 에게 ONLINE 알림 전송", friend);
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("email", email, "status", "ONLINE"));
            }

            // ✅ 친구들한테 알릴 뿐만 아니라, **내가 친구들에게도** 그들의 현재 온라인상태 알려주기
            for (String friend : friends) {
                Boolean isFriendOnline = redisTemplate.opsForSet().isMember("online_users", friend);
                if (Boolean.TRUE.equals(isFriendOnline)) {
                    messagingTemplate.convertAndSendToUser(email, "/queue/status",
                            Map.of("email", friend, "status", "ONLINE"));
                }
            }
        }
    }

    public void markOffline(String email, String sessionId) {
        String sessionsKey = "user:" + email + ":sessions";
        redisTemplate.opsForSet().remove(sessionsKey, sessionId);
        Long remaining = redisTemplate.opsForSet().size(sessionsKey);

        log.info("❌ Disconnect: user={}, sessionId={}, remaining={}", email, sessionId, remaining);

        if (remaining == null || remaining == 0) {
            redisTemplate.delete(sessionsKey);
            redisTemplate.opsForSet().remove("online_users", email);
            eventPublisher.publishOffline(email);

            List<String> friends = getFriendemails(email);
            for (String friend : friends) {
                log.info("📡 친구 [{}] 에게 OFFLINE 알림 전송", friend);
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("email", email, "status", "OFFLINE"));
            }
        }
    }

    public List<String> getOnlineFriendemails(String myemail) {
        Long myId = memberRepository.findByEmail(myemail)
                .orElseThrow(() -> new UsernameNotFoundException(myemail))
                .getId();

        List<String> allFriends = friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED, myId);
        Set<String> online = redisTemplate.opsForSet().members("online_users");
        log.info("✅ 현재 Redis online_users 값: {}", online);

        if (online == null || online.isEmpty()) {
            return List.of();
        }
        return allFriends.stream().filter(online::contains).collect(Collectors.toList());
    }

    public List<String> getFriendemails(String myemail) {
        Long myId = memberRepository.findByEmail(myemail)
                .orElseThrow(() -> new UsernameNotFoundException(myemail))
                .getId();

        List<String> result = friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED, myId);
        log.info("✅ getFriendemails() - [{}] 의 친구목록: {}", myemail, result);
        return result;
    }

    @PostConstruct
    public void clearOnlineUsersAtStartup() {
        redisTemplate.delete("online_users");
        Set<String> keys = redisTemplate.keys("user:*:sessions");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        log.info("🧹 Redis 초기화: online_users 및 user:*:sessions 삭제 완료");
    }
}
