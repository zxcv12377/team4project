package com.example.server.dto;

import com.example.server.entity.Server;
import com.example.server.entity.enums.ServerRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ServerResponseDTO {

    private Long id;
    private String name;
    private String description;
    private String role;

    public static ServerResponseDTO from(Server entity, ServerRole role) {
        return ServerResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .role(role != null ? role.name() : null)
                .description(entity.getDescription())
                .build();
    }

    public static ServerResponseDTO from(Server server) {
        return from(server, null);
    }
}
