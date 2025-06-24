package com.example.server.Handler;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.example.server.jwt.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        log.warn("✅ STOMP preSend 실행됨, command: {}", accessor.getCommand());
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            log.warn("💡 STOMP Authorization Header: {}", token);
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                log.warn("💡 JWT to validate: {}", jwt);
                if (jwtUtil.isTokenValid(jwt)) {
                    Authentication auth = jwtUtil.getAuthentication(jwt);
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    String email = jwtUtil.getEmail(jwt);
                    String nickname = jwtUtil.parseClaims(jwt).get("name", String.class);

                    accessor.setUser(auth);
                    accessor.getSessionAttributes().put("email", email);
                    accessor.getSessionAttributes().put("nickname", nickname);
                    accessor.getSessionAttributes().put("username", email);

                    log.info("✅ STOMP CONNECT - 사용자 인증 성공: {}", email);
                } else {
                    log.warn("❌ STOMP CONNECT - JWT 유효성 실패");
                    throw new IllegalArgumentException("Invalid JWT Token");
                }
            }
        }

        return message;
    }

}
