package com.example.server.scheduler;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.repository.EmailVerificationTokenRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EmailTokenCleanupScheduler {

    private final EmailVerificationTokenRepository tokenRepository;

    @Scheduled(cron = "0 0 2 * * *") // 초 분 시 일 주 월
    @Transactional
    public void deleteExpiredTokens() {
        System.out.println("토큰 삭제 스케줄러 실행됨: " + LocalDateTime.now());
        tokenRepository.deleteByExpirationDateBefore(LocalDateTime.now());
    }
}
