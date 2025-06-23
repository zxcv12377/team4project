package com.example.server.repository;

import com.example.server.entity.Friend;
import com.example.server.entity.Member;
import com.example.server.entity.FriendStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {

  // 내 모든 친구 (요청/수락 모두 포함)
  List<Friend> findByMemberAOrMemberB(Member memberA, Member memberB);

  // “수락된” 친구만 (진짜 친구 목록)
  List<Friend> findByStatusAndMemberAOrMemberB(FriendStatus status, Member memberA, Member memberB);

  // 두 사람의 친구관계(중복 검사)
  Optional<Friend> findByMemberAAndMemberB(Member memberA, Member memberB);

  // 특정 상태의 친구 목록 조회 (친구요청이 수락된 친구: ACCEPTED)
  @Query("SELECT f FROM Friend f WHERE f.status = :status AND (f.memberA.id = :myId OR f.memberB.id = :myId)")
  List<Friend> findAcceptedFriends(@Param("status") FriendStatus status, @Param("myId") Long myId);

  // 두 사람의 친구관계 (양방향 검사)
  @Query("SELECT f FROM Friend f WHERE " +
      "(f.memberA.id = :id1 AND f.memberB.id = :id2) OR " +
      "(f.memberA.id = :id2 AND f.memberB.id = :id1)")
  Optional<Friend> findRelation(@Param("id1") Long id1, @Param("id2") Long id2);

  // 내가 보낸 친구신청
  List<Friend> findByMemberAIdAndStatus(Long memberAId, FriendStatus status);

  // 내가 받은 친구신청
  List<Friend> findByMemberBIdAndStatus(Long memberBId, FriendStatus status);

  @Query("""
      SELECT CASE
        WHEN f.memberA.id = :myId THEN f.memberB.email
        ELSE f.memberA.email
      END
      FROM Friend f
      WHERE f.status = :status AND (f.memberA.id = :myId OR f.memberB.id = :myId)
      """)
  List<String> findFriendEmailsByStatusAndMyId(@Param("status") FriendStatus status, @Param("myId") Long myId);

  // 상태 기준(신청, 수락 등) 전체 조회 등 자유롭게 추가 가능함
}
