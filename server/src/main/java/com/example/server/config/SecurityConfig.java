package com.example.server.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices.RememberMeTokenAlgorithm;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.server.jwt.JwtAuthenticationEntryPoint;
import com.example.server.jwt.JwtAuthenticationFilter;
import com.example.server.jwt.JwtUtil;
import com.example.server.security.CustomMemberDetailsService;

import lombok.RequiredArgsConstructor;

@EnableMethodSecurity // @PreAuthorize, @PostAuthorize 사용
@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
        private final CustomMemberDetailsService userDetailsService;
        private final JwtUtil jwtUtil;

        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http, RememberMeServices rememberMeServices)
                        throws Exception {

                http.csrf(AbstractHttpConfigurer::disable);

                http

                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable()) // CSRF 비활성화 (REST API용)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 안씀
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/assets/**", "/css/**", "/js/**", "/upload/**",
                                                                "/uploads/**", "/api/uploads/**")
                                                .permitAll()
                                                .requestMatchers("/api/passwordreset/**").permitAll()
                                                .requestMatchers("/reviews/**", "/upload/display/**", "/img/**",
                                                                "/error", "/api/auth/**")
                                                .permitAll()
                                                // WebSocket/STOMP endpoints
                                                .requestMatchers("/ws-chat/**", "/ws-voice/**", "/app/**", "/topic/**",
                                                                "/auth/refresh")
                                                .permitAll()
                                                .requestMatchers("/api/email/send", "/api/email/verify").permitAll()

                                                .requestMatchers(HttpMethod.POST, "/api/members/register",
                                                                "/api/members/login", "/api/invite/**",
                                                                "/api/verrycons/upload",
                                                                "/api/verrycons/upload-multiple",
                                                                "/error")
                                                .permitAll()

                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/boards/**",
                                                                "/api/channels/*/boards",
                                                                "/api/board-channels",
                                                                "/api/board-channels/**",
                                                                "/api/replies/**",
                                                                "/api/members/check-nickname",
                                                                "/api/members/find-id",
                                                                "/api/servers",
                                                                "/api/verrycons/**") // 서버 검색
                                                .permitAll()
                                                .anyRequest().authenticated());

                http.sessionManagement(seesion -> seesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
                http.exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint));
                http.addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);
                http.userDetailsService(userDetailsService);
                http.rememberMe(remember -> remember.rememberMeServices(rememberMeServices()).key("myKey"));
                return http.build();
        }

        @Bean // = new 한 후 스프링 컨테이너가 관리
        PasswordEncoder passwordEncoder() {
                return PasswordEncoderFactories.createDelegatingPasswordEncoder();
        }

        @Bean
        public RememberMeServices rememberMeServices() {
                TokenBasedRememberMeServices rememberMeServices = new TokenBasedRememberMeServices(
                                "myKey", userDetailsService, RememberMeTokenAlgorithm.SHA256);
                rememberMeServices.setMatchingAlgorithm(RememberMeTokenAlgorithm.SHA256);
                rememberMeServices.setTokenValiditySeconds(60 * 60 * 24 * 7); // 7일 유효
                return rememberMeServices;
        }

        @Bean
        public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
                AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
                builder.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
                return builder.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of(
                                "http://localhost:5173",
                                "https://strongberry.p-e.kr"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public JwtAuthenticationFilter jwtFilter() {
                return new JwtAuthenticationFilter(jwtUtil);
        }

}
