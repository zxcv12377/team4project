package com.example.server.dto;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.ChatRoomType;

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
}
