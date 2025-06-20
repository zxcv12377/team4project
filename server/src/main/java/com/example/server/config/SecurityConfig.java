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
                                                .requestMatchers("/movie/list", "/movie/read").permitAll()
                                                .requestMatchers("/reviews/**", "/upload/display/**").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/member/register", "/member/login",
                                                                "/error")
                                                .permitAll()
                                                // WebSocket/STOMP endpoints
                                                .requestMatchers("/ws-chat/**", "/ws-voice/**", "/app/**", "/topic/**")
                                                .permitAll()

                                                // .requestMatchers("/api/members/register", "/api/members/login",
                                                // "/error")
                                                // .permitAll() // 회원가입/로그인
                                                // 허용
                                                .requestMatchers(HttpMethod.PUT, "/api/members/password/reset",
                                                                "/api/members/password")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/check-nickname", "/api/members/find-id")
                                                .permitAll()

                                                .requestMatchers("/api/chatrooms/**").authenticated() // 채팅 rest api
                                                .requestMatchers(HttpMethod.GET, "/api/members/mypage").authenticated()

                                                .requestMatchers(HttpMethod.POST, "/api/boards", "/api/replies/**",
                                                                "/api/members/mypage")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.PUT, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/mypage",
                                                                "/api/members/nickname")
                                                .authenticated()

                                                .requestMatchers(HttpMethod.DELETE, "/api/boards/**", "/api/replies/**",
                                                                "/api/members/mypage")
                                                .authenticated()
                                                .requestMatchers("/img/**").permitAll()
                                                .anyRequest().permitAll());

                http.sessionManagement(seesion -> seesion.sessionCreationPolicy(SessionCreationPolicy.ALWAYS));
                http.exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint));
                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
                http.userDetailsService(userDetailsService);

                http.rememberMe(remember -> remember.rememberMeServices(rememberMeServices()).key("myKey"));

                // http.csrf(csrf -> csrf.disable());

                // .requestMatchers("/", "/sample/guest").permitAll()
                // .requestMatchers("/sample/member").hasRole("USER")
                // .requestMatchers("/sample/admin").hasRole("ADMIN")
                // .anyRequest().authenticated())
                // .httpBasic(Customizer.withDefaults());
                // .formLogin(Customizer.withDefaults()); // 시큐리티가 제공하는 기본 로그인 폼 페이지
                // .authorizeHttpRequests(authorize -> authorize
                // .requestMatchers("/assets/**", "/css/**", "/js/**", "/img/**")
                // .permitAll()
                // .requestMatchers("/board/read").permitAll()
                // // .requestMatchers("/board/modify").authenticated()
                // .requestMatchers("/board/modify").hasAnyRole("ADMIN", "MANAGER", "USER")
                // .anyRequest().permitAll())

                return http.build();
        }

        @Bean // = new 한 후 스프링 컨테이너가 관리
        PasswordEncoder passwordEncoder() {
                return PasswordEncoderFactories.createDelegatingPasswordEncoder();
        }

        // @Bean
        // CustomLoginSuccessHandler successHandler() {
        // return new CustomLoginSuccessHandler();
        // }

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
        public WebMvcConfigurer corsConfigurer() {
                return new WebMvcConfigurer() {
                        @Override
                        public void addCorsMappings(CorsRegistry registry) {
                                registry.addMapping("/**")
                                                .allowedOrigins("http://localhost:5173") // React 개발 서버 주소
                                                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                                                .allowedHeaders("*")
                                                .allowCredentials(true);
                        }
                };
        }

        @Bean
        public BCryptPasswordEncoder bcryptEncoder() {
                return new BCryptPasswordEncoder();
        }
}
