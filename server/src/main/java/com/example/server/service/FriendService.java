package com.example.server.service;

import com.example.server.dto.FriendDTO;
import com.example.server.dto.FriendEvent;
import com.example.server.entity.Friend;
import com.example.server.entity.Member;
import com.example.server.entity.enums.RedisChannelConstants;
import com.example.server.entity.FriendStatus;
import com.example.server.repository.FriendRepository;
import com.example.server.repository.MemberRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    @Qualifier("friendEventRedisTemplate")
    private RedisTemplate<String, Object> redisTemplate;

    @Transactional(readOnly = true)
    public List<String> getFriendEmails(String email) {
        Long myId = memberService.getByEmail(email).getId();
        return friendRepository.findFriendEmailsByStatusAndMyId(FriendStatus.ACCEPTED, myId);
    }

    // 친구 신청 (중복/역방향까지 체크)
    @Transactional
    public void requestFriend(Long myId, Long targetId) {
        if (myId.equals(targetId))
            throw new IllegalArgumentException("본인은 친구추가 불가");

        Member me = memberRepository.findById(myId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        Member you = memberRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("상대 없음"));

        Friend friend = null;

        // 👉 현재 방향 (A→B)
        Optional<Friend> existing = friendRepository.findByMemberAAndMemberB(me, you);
        if (existing.isPresent()) {
            Friend f = existing.get();

            if (f.getStatus() == FriendStatus.REJECTED) {
                // ✅ REJECTED → REQUESTED 갱신
                f.setStatus(FriendStatus.REQUESTED);
                f.setCreatedAt(LocalDateTime.now());
                f.setMemberA(me);
                f.setMemberB(you);
                friendRepository.save(f);
                friend = f;
            } else {
                throw new IllegalStateException("이미 친구 요청 중/수락됨");
            }
        }

        // 👉 역방향 (B→A)
        if (friend == null) {
            Optional<Friend> reverse = friendRepository.findByMemberAAndMemberB(you, me);
            if (reverse.isPresent()) {
                Friend f = reverse.get();
                if (f.getStatus() == FriendStatus.REJECTED) {
                    // ✅ 역방향 REJECTED → 기존 삭제 후 새로 생성
                    friendRepository.delete(f);
                    friend = Friend.builder()
                            .memberA(me)
                            .memberB(you)
                            .status(FriendStatus.REQUESTED)
                            .createdAt(LocalDateTime.now())
                            .build();
                    friendRepository.save(friend);
                } else {
                    throw new IllegalStateException("이미 친구 요청 중/수락됨");
                }
            }
        }

        // 👉 완전 신규
        if (friend == null && existing.isEmpty()) {
            friend = Friend.builder()
                    .memberA(me)
                    .memberB(you)
                    .status(FriendStatus.REQUESTED)
                    .createdAt(LocalDateTime.now())
                    .build();
            friendRepository.save(friend);
        }

        if (friend == null) {
            throw new IllegalStateException("친구 요청 생성 실패");
        }

        // ✅ 1. 수신자에게 실시간 요청 알림
        FriendEvent toReceiver = new FriendEvent(
                "REQUEST_RECEIVED",
                targetId,
                FriendDTO.RequestResponse.from(friend));
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toReceiver);

        // ✅ 2. 신청자 본인에게도 실시간 보낸 요청 알림
        FriendEvent toSender = new FriendEvent(
                "REQUEST_SENT",
                myId,
                FriendDTO.RequestResponse.from(friend));
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toSender);
    }

    @Transactional
    public void acceptFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청 없음"));

        // 내가 요청 받은 대상이 맞는지 확인
        if (!friend.getMemberB().getId().equals(myId))
            throw new IllegalStateException("수락 권한 없음");

        // 상태 변경
        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        // 요청자에게 → 친구 추가됨 메시지
        FriendEvent toRequester = new FriendEvent(
                "REQUEST_ACCEPTED",
                friend.getMemberA().getId(), // 요청자 ID
                FriendDTO.RequestResponse.from(friend));
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toRequester);

        // 수락자에게도 → 친구 추가됨 메시지 (자기 목록 반영용)
        FriendEvent toAccepter = new FriendEvent(
                "REQUEST_ACCEPTED",
                friend.getMemberB().getId(), // 수락자 ID
                FriendDTO.RequestResponse.from(friend));
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toAccepter);

        // 서버 연결끊김 대비 websoket 전송 보강
        String requesterUsername = memberRepository.findEmailById(friend.getMemberA().getId());
        String accepterUsername = memberRepository.findEmailById(friend.getMemberB().getId());

        messagingTemplate.convertAndSendToUser(requesterUsername, "/queue/friend", toRequester);
        messagingTemplate.convertAndSendToUser(accepterUsername, "/queue/friend", toAccepter);
        // 반대방향 REJECTED 기록 제거
        friendRepository.findByMemberAAndMemberB(friend.getMemberB(), friend.getMemberA())
                .filter(f -> f.getStatus() == FriendStatus.REJECTED)
                .ifPresent(friendRepository::delete);
    }

    // 내 친구(수락된 친구) 목록
    public List<FriendDTO.SimpleResponse> getFriends(Long myId) {
        List<Friend> friends = friendRepository.findAcceptedFriends(FriendStatus.ACCEPTED, myId);
        return friends.stream().map(f -> FriendDTO.SimpleResponse.from(f, myId)).toList();
    }

    // 친구 신청 거절 (필요하면)
    @Transactional
    public void rejectFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청 없음"));

        // 내가 상대가 맞는지 검증 (memberB가 나)
        if (!friend.getMemberB().getId().equals(myId))
            throw new IllegalStateException("거절 권한 없음");

        friend.setStatus(FriendStatus.REJECTED);
        friendRepository.save(friend);

        // 🔥 실시간 거절 이벤트 → 요청자에게 보내기
        FriendEvent event = new FriendEvent(
                "REQUEST_REJECTED",
                friend.getMemberA().getId(), // 요청자 ID
                FriendDTO.RequestResponse.from(friend));

        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, event);

    }

    // 친구요청 취소 (내가 요청자일 때만 가능)
    @Transactional
    public void cancelFriendRequest(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("요청 없음"));

        // 내가 요청자(A)여야만 함
        if (!friend.getMemberA().getId().equals(myId)) {
            throw new IllegalStateException("요청 취소 권한 없음");
        }

        Member receiver = friend.getMemberB();

        friendRepository.delete(friend);

        // 수신자에게 WebSocket 이벤트 발송
        FriendEvent cancelEvent = new FriendEvent(
                "REQUEST_CANCELLED",
                receiver.getId(), // 수신자 ID
                FriendDTO.RequestResponse.from(friend));

        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, cancelEvent);
    }

    // 상대와 나의 관계 상태 조회
    public FriendStatus getStatus(Long myId, Long targetId) {
        // 자기 자신이면 친구관계 없음 처리
        if (myId.equals(targetId))
            return FriendStatus.NONE;
        Optional<Friend> relation = friendRepository.findRelation(myId, targetId);
        return relation.map(Friend::getStatus).orElse(FriendStatus.NONE);
    }

    // 친구 삭제
    @Transactional
    public void deleteFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 없음"));

        Member me = memberRepository.findById(myId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        Member other = null;
        if (friend.getMemberA().getId().equals(myId)) {
            other = friend.getMemberB();
        } else if (friend.getMemberB().getId().equals(myId)) {
            other = friend.getMemberA();
        } else {
            throw new IllegalStateException("삭제 권한 없음");
        }

        friendRepository.delete(friend);

        // 🔥 삭제 이벤트 양방향 발송
        FriendEvent toMe = new FriendEvent(
                "FRIEND_DELETED",
                me.getId(),
                FriendDTO.RequestResponse.from(friend));
        FriendEvent toOther = new FriendEvent(
                "FRIEND_DELETED",
                other.getId(),
                FriendDTO.RequestResponse.from(friend));

        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toMe);
        redisTemplate.convertAndSend(RedisChannelConstants.FRIEND_REQUEST_CHANNEL, toOther);
    }

    // 내가 받은 친구 요청 목록
    public List<FriendDTO.RequestResponse> getReceivedFriendRequests(Long memberId) {
        List<Friend> receivedRequests = friendRepository.findByMemberBIdAndStatus(memberId, FriendStatus.REQUESTED);
        return receivedRequests.stream()
                .map(FriendDTO.RequestResponse::from)
                .collect(Collectors.toList());
    }

    // 내가 보낸 친구 요청 목록
    public List<FriendDTO.RequestResponse> getSentFriendRequests(Long memberId) {
        List<Friend> sentRequests = friendRepository.findByMemberAIdAndStatus(memberId, FriendStatus.REQUESTED);
        return sentRequests.stream()
                .map(FriendDTO.RequestResponse::from)
                .collect(Collectors.toList());
    }

    // 친구 요청 시의 정보 조회(요청취소 등)
    @Transactional(readOnly = true)
    public Friend getFriendOrThrow(Long friendId) {
        return friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 정보 없음"));
    }
}
