package com.example.server.config;

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
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import com.example.server.Handler.StompHandler;
import com.example.server.entity.Member;
import com.example.server.jwt.JwtUtil;
import com.example.server.repository.MemberRepository;
import com.example.server.websoket.JwtHandshakeInterceptor;
import com.example.server.websoket.StompPrincipal;

@Slf4j
@EnableWebSocketMessageBroker
@Configuration(proxyBeanMethods = false)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final StompHandler stompHandler;
    private final MemberRepository memberRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // registry.addEndpoint("/ws-chat")
        // .setAllowedOriginPatterns("*")
        // .setHandshakeHandler(new DefaultHandshakeHandler())
        // .addInterceptors(jwtHandshakeInterceptor) // JWT 인증 인터셉터
        // .withSockJS();

        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
        // .setHandshakeHandler(new DefaultHandshakeHandler());
        // .addInterceptors(jwtHandshakeInterceptor); // JWT 인증 인터셉터

        registry.addEndpoint("/ws-voice")
                .setAllowedOriginPatterns("*")
                .addInterceptors(jwtHandshakeInterceptor) // JWT 인증 인터셉터
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor());
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && accessor.getSessionId() != null && accessor.getDestination() != null) {
                    if (accessor.getDestination().startsWith("/voice")) {
                        return stompHandler.preSend(message, channel); // voice 전용
                    }
                }
                return message;
            }
        });
        // registration.interceptors(stompHandler);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry
                .enableStompBrokerRelay("/topic") // 채팅방 등 메시지 송신용
                .setRelayHost("rabbitmq") // Redis 호스트
                .setRelayPort(61613) // Redis STOMP 포트
                .setClientLogin("guest") // Redis나 RabbitMQ 브로커 계정
                .setClientPasscode("guest") // Redis나 RabbitMQ 브로커 계정
                .setSystemHeartbeatSendInterval(10000)
                .setSystemHeartbeatReceiveInterval(10000);

        registry.setApplicationDestinationPrefixes("/app"); // 클라이언트 전송 prefix
        registry.setUserDestinationPrefix("/user");
    }

    @Bean
    public ChannelInterceptor jwtChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var accessor = MessageHeaderAccessor
                        .getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    try {
                        accessor.setLeaveMutable(true);

                        String bearer = accessor.getFirstNativeHeader("Authorization");
                        if (bearer == null || !bearer.startsWith("Bearer ")) {
                            throw new IllegalArgumentException("Missing or invalid Authorization header");
                        }
                        log.info("Authorization Header: {}", bearer);

                        String token = bearer.substring(7);
                        if (!jwtUtil.isTokenValid(token)) {
                            throw new IllegalArgumentException("Invalid JWT token");
                        }
                        String email = jwtUtil.validateAndGetSubject(token);
                        String sessionId = accessor.getSessionId();

                        accessor.setUser(new StompPrincipal(email, sessionId));
                        accessor.getSessionAttributes().put("email", email);
                        accessor.getSessionAttributes().put("nickname",
                                memberRepository.findByEmail(email)
                                        .map(Member::getNickname)
                                        .orElse("알 수 없음"));

                    } catch (Exception e) {
                        log.error("❌ STOMP CONNECT 인증 실패: {}", e.getMessage(), e);
                        throw e;
                    }
                }

                return message;
            }
        };
    }

}