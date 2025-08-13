package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;

public interface ReplyLikeRepository extends JpaRepository<ReplyLike, Long> {
    boolean existsByReplyAndMember(Reply reply, Member member);

    Optional<ReplyLike> findByReplyAndMember(Reply reply, Member member);

    Long countByReply(Reply reply);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ReplyLike rl set rl.member = null where rl.member.id = :memberId")
    int nullMemberByMemberId(@Param("memberId") Long memberId);
}