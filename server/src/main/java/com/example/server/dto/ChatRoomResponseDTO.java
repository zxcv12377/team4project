package com.example.server.dto;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.ChatRoomMember;
import com.example.server.entity.Member;
import com.example.server.entity.enums.ChatRoomType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatRoomResponseDTO {

    private Long id;
    private String name;
    private String description;
    private String type;
    private ChatRoomType roomType;
    private Long serverId;
    private String serverName;
    private Boolean visible;

    // 필요하면 ownerName 등 추가

    public static ChatRoomResponseDTO from(ChatRoom room) {
        return ChatRoomResponseDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .type(null != room.getType() ? room.getType().name() : null)
                .roomType(room.getRoomType())
                .build();
    }

    public static ChatRoomResponseDTO from(ChatRoom room, Long myId) {
        Member opponent = room.getMembers().stream()
                .map(ChatRoomMember::getMember)
                .filter(m -> !m.getId().equals(myId))
                .findFirst()
                .orElse(null);

        Boolean visible = room.getMembers().stream()
                .filter(cm -> cm.getMember().getId().equals(myId))
                .map(ChatRoomMember::isVisible)
                .findFirst()
                .orElse(true);

        return ChatRoomResponseDTO.builder()
                .id(room.getId())
                .name(opponent != null ? opponent.getNickname() : "상대 없음")
                .visible(visible)
                .build();
    }
}
