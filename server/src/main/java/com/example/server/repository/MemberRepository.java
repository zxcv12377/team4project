package com.example.server.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    Optional<Member> findByPassword(String password);

    // Optional<Member> findByNickname(String nickname);

    List<Member> findAllByNickname(String nickname);

    @Query("SELECT m.email FROM Member m WHERE m.id = :id")
    String findEmailById(@Param("id") Long id);

}
