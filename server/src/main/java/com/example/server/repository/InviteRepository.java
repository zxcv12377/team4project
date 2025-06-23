package com.example.server.repository;

import com.example.server.entity.Invite;
import com.example.server.entity.Member;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface InviteRepository extends JpaRepository<Invite, Long> {

    Optional<Invite> findByCodeAndActiveTrue(String code);

    List<Invite> findAllByRoom_IdAndActiveTrue(Long roomId);

    void deleteAllByCreator(Member member);

}
