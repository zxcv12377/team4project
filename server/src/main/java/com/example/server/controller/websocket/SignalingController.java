package com.example.server.controller.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.example.server.dto.SignalingMessage;
import com.example.server.dto.voiceChat.SpeakingStatusRequest;
import com.example.server.jwt.JwtUtil;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
public class SignalingController {

    private final JwtUtil jwtUtil;

    SignalingController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @MessageMapping("/voice/offer/{roomId}")
    @SendTo("/topic/voice/offer/{roomId}")
    public SignalingMessage offer(SignalingMessage msg) {
        return msg;
    }

    @MessageMapping("/voice/answer/{roomId}")
    @SendTo("/topic/voice/answer/{roomId}")
    public SignalingMessage answer(SignalingMessage msg) {
        return msg;
    }

    @MessageMapping("/voice/candidate/{roomId}")
    @SendTo("/topic/voice/candidate/{roomId}")
    public SignalingMessage candidate(SignalingMessage msg) {
        return msg;
    }

    @MessageMapping("/voice/speaking")
    @SendTo("/topic/voice/{roomId}/speaking")
    public SpeakingStatusRequest handleSpeaking(SpeakingStatusRequest status,
            Message<?> message) {
        SimpMessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message,
                SimpMessageHeaderAccessor.class);
        if (accessor != null && accessor.getSessionAttributes() != null) {
            String token = (String) accessor.getSessionAttributes().get("token");
            if (jwtUtil.isTokenValid(token)) {
                Authentication auth = jwtUtil.getAuthentication(token);
                String email = auth.getName();
                log.info(email);
            }
        }

        return status;
    }
}
