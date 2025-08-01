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
import com.example.server.entity.enums.FriendStatus;
import com.example.server.entity.enums.UserStatus;
import com.example.server.infra.EventPublisher;
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
    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;

    public void markOnline(String Email, String sessionId) {
        String sessionKey = "user:" + Email + ":sessions";

        Set<String> oldSessions = redisTemplate.opsForSet().members(sessionKey);
        if (oldSessions != null) {
            for (String oldSession : oldSessions) {
                redisTemplate.opsForSet().remove(sessionKey, oldSession);
                log.info("♻️ 재연결: 이전 세션 {} 제거됨", oldSession);
            }
        }

        redisTemplate.opsForSet().add(sessionKey, sessionId);
        redisTemplate.opsForSet().add("online_users", Email);
        log.info("✅ 최종 세션 등록: user={}, sessionId={}", Email, sessionId);

        if (oldSessions == null || oldSessions.isEmpty()) {
            List<String> friendUsernames = getFriendUsernames(Email);
            eventPublisher.publishOnline(Email, friendUsernames);
        }
    }

    public void markOffline(String Email, String sessionId) {
        String sessionsKey = "user:" + Email + ":sessions";
        redisTemplate.opsForSet().remove(sessionsKey, sessionId);
        Long remaining = redisTemplate.opsForSet().size(sessionsKey);

        log.info("❌ Disconnect: user={}, sessionId={}, remaining={}", Email, sessionId, remaining);

        if (remaining == null || remaining == 0) {
            redisTemplate.delete(sessionsKey);
            redisTemplate.opsForSet().remove("online_users", Email);

            List<String> friendUsernames = getFriendUsernames(Email);
            eventPublisher.publishOffline(Email, friendUsernames);
        }
    }

    public List<String> getOnlineFriendEmails(String myEmail) {
        Long myId = memberRepository.findByEmail(myEmail)
                .orElseThrow(() -> new UsernameNotFoundException(myEmail))
                .getId();

        List<String> allFriends = friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED,
                myId);
        Set<String> online = redisTemplate.opsForSet().members("online_users");
        return allFriends.stream().filter(online::contains).collect(Collectors.toList());
    }

    public List<String> getFriendUsernames(String myEmail) {
        Long myId = memberRepository.findByEmail(myEmail)
                .orElseThrow(() -> new UsernameNotFoundException(myEmail))
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

        log.info("🧹 Redis 초기화: online_users 및 user:*:sessions, user:*:refresh 삭제 완료");
    }
}
