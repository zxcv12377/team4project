package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    Optional<Member> findByPassword(String password);

    boolean existsByNickname(String nickname);

}
