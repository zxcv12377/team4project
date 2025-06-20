package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FriendEvent {
    private String type; // 예: REQUEST_RECEIVED, REQUEST_ACCEPTED, FRIEND_DELETED
    private Long targetUserId; // 이벤트 수신 대상 (WebSocket Email 찾아야 하므로)
    private Object payload; // ✔ 여기에 FriendDTO.* 타입을 그대로 넣으면 됨
}