package com.example.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InviteResponseDTO {
    // 프론트에 보여줄 정보
    private String inviteCode;
    private Long roomId;
    private String roomName;
    private String roomDescription;
    private String creatorName;
    private LocalDateTime expireAt;
    private Integer maxUses;
    private Integer uses;
    private Boolean active;
    private String memo;
}
