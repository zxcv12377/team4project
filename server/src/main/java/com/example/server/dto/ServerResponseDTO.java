package com.example.server.dto;

import com.example.server.entity.Server;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ServerResponseDTO {

    private Long id;
    private String name;
    private String description;

    public static ServerResponseDTO from(Server entity) {
        return ServerResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .build();
    }
}
