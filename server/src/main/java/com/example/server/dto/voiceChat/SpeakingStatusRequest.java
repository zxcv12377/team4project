package com.example.server.dto.voiceChat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingStatusRequest {
    private Long memberId;
    private Long chatRoomlId;
    private boolean speaking;
}
