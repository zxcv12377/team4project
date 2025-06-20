package com.example.server.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.example.server.entity.enums.WebSocketMessageType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessageDTO {

    private WebSocketMessageType type;
    private String sender;
    private Object payload;
    private LocalDateTime timestamp;
    private Map<String, Object> metadata;
}
