package com.example.server.config;

import com.example.server.entity.BoardChannel;
import com.example.server.repository.BoardChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultChannelInitializer implements ApplicationRunner {

        // 기본 채널 생성 (공지사항, 문의하기, 자유게시판)

        private final BoardChannelRepository repo;

        @Override
        public void run(ApplicationArguments args) {
                List<BoardChannel> defaults = List.of(
                                BoardChannel.builder()
                                                .name("공지사항")
                                                .description("시스템 공지 및 업데이트")
                                                .build(),
                                BoardChannel.builder()
                                                .name("문의하기")
                                                .description("Q&A, 건의사항")
                                                .build(),
                                BoardChannel.builder()
                                                .name("최고딸기 게시판")
                                                .description("딸기(좋아요)를 많이 받은 게시글 모음")
                                                .build());

                defaults.forEach(c -> repo.findByName(c.getName())
                                .orElseGet(() -> {
                                        log.info("▶ 기본 채널 생성: {}", c.getName());
                                        return repo.save(c);
                                }));
        }
}
