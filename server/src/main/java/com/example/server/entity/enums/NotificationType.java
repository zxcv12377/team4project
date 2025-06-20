package com.example.server.entity.enums;

public enum NotificationType {
    BOARD_REPLY("새로운 댓글이 달렸습니다"),
    BOARD_MENTION("게시글에서 멘션되었습니다"),
    REPLY_MENTION("댓글에서 멘션되었습니다"),
    FRIEND_REQUEST("새로운 친구 요청이 있습니다"),
    FRIEND_ACCEPT("친구 요청이 수락되었습니다"),
    CHAT_MESSAGE("새로운 채팅 메시지가 있습니다"),
    SYSTEM_NOTICE("시스템 알림");

    private final String defaultMessage;

    NotificationType(String defaultMessage) {
        this.defaultMessage = defaultMessage;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
