package com.example.server.config;

import com.example.server.entity.BoardChannel;
import com.example.server.entity.Member;
import com.example.server.entity.enums.BoardChannelType;
import com.example.server.entity.enums.MemberRole;
import com.example.server.repository.BoardChannelRepository;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultChannelInitializer implements ApplicationRunner {

        // 기본 채널 생성 (공지사항, 문의하기, 자유게시판)

        private final BoardChannelRepository repo;
        private final MemberRepository memberRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(ApplicationArguments args) {
                List<BoardChannel> defaults = List.of(
                                BoardChannel.builder()
                                                .name("공지사항")
                                                .description("시스템 공지 및 업데이트")
                                                .type(BoardChannelType.NOTICE)
                                                .build(),
                                BoardChannel.builder()
                                                .name("문의하기")
                                                .description("Q&A, 건의사항")
                                                .type(BoardChannelType.INQUIRY)
                                                .build(),
                                BoardChannel.builder()
                                                .name("최고딸기 게시판")
                                                .description("딸기(좋아요)를 많이 받은 게시글 모음")
                                                .type(BoardChannelType.NORMAL)
                                                .build());
                // 관리자 계정 생성
                String adminEmail = "admin@test.com";
                memberRepository.findByEmail(adminEmail).orElseGet(() -> {
                        log.info("▶ 관리자 계정 생성: {}", adminEmail);
                        Member admin = Member.builder()
                                        .email(adminEmail)
                                        .nickname("관리자")
                                        .password(passwordEncoder.encode("1111"))
                                        .roles(new HashSet<>(Set.of(MemberRole.ADMIN)))
                                        .emailVerified(true)
                                        .agree(true)
                                        .build();
                        return memberRepository.save(admin);
                });

                defaults.forEach(c -> repo.findByName(c.getName())
                                .orElseGet(() -> {
                                        log.info("▶ 기본 채널 생성: {}", c.getName());
                                        return repo.save(c);
                                }));
        }
}
