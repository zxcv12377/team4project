package com.example.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices.RememberMeTokenAlgorithm;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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

                JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);

                http.csrf(AbstractHttpConfigurer::disable);

                http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable()) // CSRF 비활성화 (REST API용)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 안씀
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/assets/**", "/css/**", "/js/**", "/upload/**")
                                                .permitAll()
                                                // WebSocket/STOMP endpoints
                                                .requestMatchers("/ws-chat/**", "/ws-voice/**", "/app/**", "/topic/**")
                                                .permitAll()
                                                .requestMatchers("/api/members/register", "/api/members/login").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/boards/list", "/api/boards/read/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/replies/board/**", "/api/replies/**").permitAll()

                                                // .requestMatchers(HttpMethod.GET, "/board/**","/api/boards/**", "/api/replies/**",
                                                //                 "/api/members/check-nickname", "/api/members/find-id")
                                                // .permitAll()

                                                .requestMatchers("/api/chatrooms/**").authenticated() // 채팅 rest api
                                                .requestMatchers(HttpMethod.GET, "/api/members/mypage").authenticated()

                                                .requestMatchers(HttpMethod.POST, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/mypage","/err")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.PUT, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/mypage",
                                                                "/api/members/nickname")
                                                .authenticated()

                                                .requestMatchers(HttpMethod.DELETE, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/mypage")
                                                .authenticated()
                                                .anyRequest().permitAll());

                http.sessionManagement(seesion -> seesion.sessionCreationPolicy(SessionCreationPolicy.ALWAYS));
                http.exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint));
                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
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

        // AuthenticationManager 수동 등록 (로그인 처리에 필요)
        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }


        @Bean
        public BCryptPasswordEncoder bcryptEncoder() {
                return new BCryptPasswordEncoder();
        }
}
