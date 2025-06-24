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

        // Redis에 등록된 기존 세션들을 가져온다
        Set<String> oldSessions = redisTemplate.opsForSet().members(sessionKey);
        if (oldSessions != null) {
            for (String oldSession : oldSessions) {
                redisTemplate.opsForSet().remove(sessionKey, oldSession);
                log.info("♻️ 재연결: 이전 세션 {} 제거됨", oldSession);
            }
        }

        // 새 세션만 남도록 등록
        redisTemplate.opsForSet().add(sessionKey, sessionId);

        // online_users 등록 (이미 들어있어도 중복 안전)
        redisTemplate.opsForSet().add("online_users", email);
        log.info(" 최종 세션 등록: user={}, sessionId={}", email, sessionId);

        // 최초 등록인 경우에만 브로드캐스트
        if (oldSessions == null || oldSessions.isEmpty()) {
            eventPublisher.publishOnline(email);
            messagingTemplate.convertAndSend("/topic/online-users",
                    new StatusChangeEvent(email, UserStatus.ONLINE));

            for (String friend : getFriendemails(email)) {
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("email", email, "status", "ONLINE"));
            }
        }
    }

    public void markOffline(String email, String sessionId) {
        String sessionsKey = "user:" + email + ":sessions";
        redisTemplate.opsForSet().remove(sessionsKey, sessionId);
        Long remaining = redisTemplate.opsForSet().size(sessionsKey);

        // 디버깅 로그
        log.info("❌ Disconnect: user={}, sessionId={}, remaining={}", email, sessionId, remaining);

        if (remaining == null || remaining == 0) {
            redisTemplate.delete(sessionsKey);
            redisTemplate.opsForSet().remove("online_users", email);

            // 상태 브로드캐스트
            eventPublisher.publishOffline(email);
            messagingTemplate.convertAndSend("/topic/online-users",
                    new StatusChangeEvent(email, UserStatus.OFFLINE));

            // 친구에게만 전송
            for (String friend : getFriendemails(email)) {
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("email", email, "status", "OFFLINE"));
            }
        }
    }

    public List<String> getOnlineFriendemails(String myemail) {
        Long myId = memberRepository.findByEmail(myemail)
                .orElseThrow(() -> new UsernameNotFoundException(myemail))
                .getId();

        List<String> allFriends = friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED,
                myId);
        Set<String> online = redisTemplate.opsForSet().members("online_users");
        return allFriends.stream().filter(online::contains).collect(Collectors.toList());
    }

    public List<String> getFriendemails(String myemail) {
        Long myId = memberRepository.findByEmail(myemail)
                .orElseThrow(() -> new UsernameNotFoundException(myemail))
                .getId();

        return friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED, myId);
    }

    // 서버 실행 시 online_users, session 초기화

    @PostConstruct
    public void clearOnlineUsersAtStartup() {

        redisTemplate.delete("online_users");
        // 모든 세션 키 삭제
        Set<String> keys = redisTemplate.keys("user:*:sessions");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        log.info("🧹 Redis 초기화: online_users 및 user:*:sessions 삭제 완료");
    }
}
