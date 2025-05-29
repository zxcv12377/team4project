package com.example.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Member findByNickname(String nickname);

}
