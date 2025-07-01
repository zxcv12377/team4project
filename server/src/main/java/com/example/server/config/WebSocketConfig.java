package com.example.server.config;

import com.example.server.entity.Member;
import com.example.server.jwt.JwtUtil;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.*;

@Slf4j
@EnableWebSocketMessageBroker
@Configuration(proxyBeanMethods = false)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws-voice")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry
                .enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost("localhost")
                .setRelayPort(61613)
                .setClientLogin("guest")
                .setClientPasscode("guest")
                .setSystemHeartbeatSendInterval(10000)
                .setSystemHeartbeatReceiveInterval(10000);

        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor());
    }

    @Bean
    public ChannelInterceptor jwtChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    try {
                        accessor.setLeaveMutable(true);

                        String bearer = accessor.getFirstNativeHeader("Authorization");
                        if (bearer == null || !bearer.startsWith("Bearer ")) {
                            throw new IllegalArgumentException("Missing or invalid Authorization header");
                        }

                        String token = bearer.substring(7);
                        if (!jwtUtil.isTokenValid(token)) {
                            throw new IllegalArgumentException("Invalid JWT token");
                        }

                        String email = jwtUtil.validateAndGetSubject(token);
                        String sessionId = accessor.getSessionId();

                        // ✅ 핵심: Spring Security 인증 객체로 세팅
                        accessor.setUser(new UsernamePasswordAuthenticationToken(email, null, null));

                        // ✅ 부가 정보 세션 속성 저장 (선택)
                        accessor.getSessionAttributes().put("email", email);
                        accessor.getSessionAttributes().put("nickname",
                                memberRepository.findByEmail(email)
                                        .map(Member::getNickname)
                                        .orElse("알 수 없음"));

                        log.info("✅ WebSocket CONNECT 성공: email={}, sessionId={}", email, sessionId);

                    } catch (Exception e) {
                        log.error("❌ STOMP CONNECT JWT 인증 실패: {}", e.getMessage(), e);
                        throw e;
                    }
                }

                return message;
            }
        };
    }
}
