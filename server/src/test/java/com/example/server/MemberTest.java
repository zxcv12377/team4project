package com.example.server;

import com.example.server.entity.Member;
import com.example.server.entity.enums.MemberRole;
import com.example.server.repository.MemberRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

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

        // when
        Member saved = memberRepository.save(admin);

        // then
        assertNotNull(saved.getId(), "ID가 생성돼야 합니다");
        assertTrue(saved.getRoles().contains(MemberRole.ADMIN), "ADMIN 권한이 포함돼야 합니다");
        // PrePersist 로직이 빈 roles 에만 USER를 추가하므로 여기서는 ADMIN만 존재
        assertEquals(1, saved.getRoles().size(), "불필요한 추가 권한이 없어야 합니다");
    }
}
