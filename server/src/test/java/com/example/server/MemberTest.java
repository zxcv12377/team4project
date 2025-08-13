package com.example.server;

import com.example.server.entity.Member;
import com.example.server.entity.enums.MemberRole;
import com.example.server.repository.MemberRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MemberTest {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("ADMIN 권한 회원이 정상적으로 저장된다")
    void createAdminMember() {
        String unique = java.util.UUID.randomUUID().toString().substring(0, 8);
        String email = "admin+" + unique + "@test.com";
        // given
        Member admin = Member.builder()
                .email("admin@test.com")
                .nickname("관리자")
                .password(passwordEncoder.encode("1111"))
                // Immutable Set.of(...) 대신 modifiable HashSet 사용 → 추후 권한 추가 시 안전
                .roles(new HashSet<>(Set.of(MemberRole.ADMIN)))
                .emailVerified(true)
                .agree(true)

                .build();

        Member saved = memberRepository.save(admin);

        assertNotNull(saved.getId(), "ID가 생성돼야 합니다");
        assertTrue(saved.getRoles().contains(MemberRole.ADMIN), "ADMIN 권한이 포함돼야 합니다");
        assertEquals(1, saved.getRoles().size(), "불필요한 추가 권한이 없어야 합니다");
    }

    @Test
    @DisplayName("일반(USER) 회원 10명이 정상적으로 저장된다")
    void createTenUserMembers() {
        List<Member> users = IntStream.rangeClosed(1, 10)
                .mapToObj(i -> Member.builder()
                        .email(String.format("user%02d@test.com", i))
                        .nickname(String.format("사용자%02d", i))
                        .password(passwordEncoder.encode("1111"))
                        .roles(new HashSet<>(Set.of(MemberRole.USER)))
                        .emailVerified(true)
                        .agree(true)

                        .build())
                .toList();

        List<Member> saved = memberRepository.saveAll(users);

        assertEquals(10, saved.size(), "10명이 저장돼야 합니다");
        saved.forEach(u -> {
            assertNotNull(u.getId(), "ID가 생성돼야 합니다");
            assertTrue(u.getRoles().contains(MemberRole.USER), "USER 권한이 포함돼야 합니다");
            assertEquals(1, u.getRoles().size(), "불필요한 추가 권한이 없어야 합니다");
        });
    }
}
