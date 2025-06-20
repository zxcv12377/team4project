package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalingMessage {

    private String type; // "offer", "answer", "candidate"
    private String sdp; // SDP offer/answer
    private String sender; // sender ID (memberId)
    private IceCandidate candidate; // ICE 정보 (옵션)

    // ✅ 내부 클래스로 ICE 후보 정의
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IceCandidate {
        private String candidate;
        private String sdpMid;
        private int sdpMLineIndex;

    }
}
