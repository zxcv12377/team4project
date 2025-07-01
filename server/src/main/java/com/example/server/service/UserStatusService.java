package com.example.server.service;

import java.util.HashSet;
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

        // ✅ 기존 세션 정리
        Set<String> existingSessions = redisTemplate.opsForSet().members(sessionKey);
        if (existingSessions != null && !existingSessions.isEmpty()) {
            redisTemplate.opsForSet().remove(sessionKey, existingSessions.toArray());
            log.info("♻️ 기존 세션 제거: user={}, removedSessions={}", email, existingSessions);
        }

        // ✅ 새로운 세션 등록
        redisTemplate.opsForSet().add(sessionKey, sessionId);
        redisTemplate.opsForSet().add("online_users", email);
        log.info("✅ 세션 등록 완료: user={}, sessionId={}", email, sessionId);

        // ✅ Redis PubSub 브로드캐스트
        eventPublisher.publishOnline(email);

        // ✅ 전체 구독자용 브로드캐스트 (필요 시)
        messagingTemplate.convertAndSend("/topic/online-users",
                new StatusChangeEvent(email, UserStatus.ONLINE));

        // ✅ 친구 목록 (내가 친구 추가한 사람 + 나를 친구로 추가한 사람 = 양방향 모두 포함)
        List<String> notifyTargets = friendRepository.findAllFriendEmailsForNotify(email);

        // ✅ 친구들에게 실시간 알림 전송
        for (String friendEmail : notifyTargets) {
            log.info("📡 ONLINE 상태 전송 → 대상: {}, 변경된 유저: {}", friendEmail, email);
            messagingTemplate.convertAndSendToUser(friendEmail, "/queue/status",
                    Map.of("email", email, "status", "ONLINE"));
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
            messagingTemplate.convertAndSend("/topic/online-users",
                    new StatusChangeEvent(email, UserStatus.OFFLINE));
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
