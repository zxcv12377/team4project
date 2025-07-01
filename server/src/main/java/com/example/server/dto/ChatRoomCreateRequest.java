package com.example.server.dto;

import com.example.server.entity.enums.ChannelType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomCreateRequest {
    private String name;
    private ChannelType type;
}
