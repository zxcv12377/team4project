package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;

public interface ReplyLikeRepository extends JpaRepository<ReplyLike, Long> {
    boolean existsByReplyAndMember(Reply reply, Member member);

    Optional<ReplyLike> findByReplyAndMember(Reply reply, Member member);

    Long countByReply(Reply reply);

}
