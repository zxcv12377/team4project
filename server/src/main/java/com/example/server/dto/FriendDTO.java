package com.example.server.dto;

import java.time.LocalDateTime;

import com.example.server.entity.Friend;
import com.example.server.entity.Member;
import com.example.server.entity.enums.FriendStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

@Data
public class FriendDTO {

    @Data
    public static class Request {
        private Long targetMemberId; // 친구 신청 대상
    }

    // 프론트에 내려줄 단순 DTO (상대방만!)
    @Data
    public static class SimpleResponse {
        private Long friendId; // 친구관계 PK
        private Long memberId; // 상대방 PK
        private String name; // 상대방 이름
        private String profile; // (프로필 경로 등)
        private String email;
        // 필요하면 status 등도 추가

        public static SimpleResponse from(Friend f, Long myId) {
            SimpleResponse dto = new SimpleResponse();
            dto.setFriendId(f.getId());
            Member target;
            if (f.getMemberA().getId().equals(myId)) {
                target = f.getMemberB();
            } else {
                target = f.getMemberA();
            }
            dto.setMemberId(target.getId());
            dto.setName(target.getNickname());
            dto.setProfile(target.getProfileimg());
            dto.setEmail(target.getEmail()); // ← email 값 세팅
            return dto;
        }
    }

    // 친구 신청 요청 응답
    @Getter
    @AllArgsConstructor
    public static class RequestResponse {
        private Long requestId;
        private Long requesterId;
        private String requesterNickname;
        private String requesterEmail;
        private Long receiverId;
        private String receiverNickname;
        private String receiverEmail;
        private LocalDateTime requestTime;

        public static RequestResponse from(Friend friend) {
            return new RequestResponse(
                    friend.getId(),
                    friend.getMemberA().getId(),
                    friend.getMemberA().getNickname(),
                    friend.getMemberA().getEmail(),
                    friend.getMemberB().getId(),
                    friend.getMemberB().getNickname(),
                    friend.getMemberB().getEmail(),
                    friend.getCreatedAt());
        }
    }

    // 상태 응답
    @Data
    @AllArgsConstructor
    public static class StatusResponse {
        private FriendStatus status;
    }
}
