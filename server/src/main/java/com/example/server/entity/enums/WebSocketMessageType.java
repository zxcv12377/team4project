package com.example.server.entity.enums;

public enum WebSocketMessageType {
    CHAT, // 기존 채팅 메시지
    USER_STATUS, // 사용자 상태 변경
    NOTIFICATION, // 알림
    SYSTEM_EVENT, // 시스템 이벤트
    TYPING, // 타이핑 상태
    READ_STATUS, // 읽음 상태
    BOARD_EVENT, // 게시판 이벤트
    PROFILE_CHANGE // 프로필 변경
}
