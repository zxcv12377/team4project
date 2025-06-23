package com.example.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InviteRequestDTO {

    private Long roomId;
    private LocalDateTime expireAt; // null이면 무제한
    private Integer maxUses; // null이면 무제한
    private String memo; // (옵션) 설명/라벨
}
