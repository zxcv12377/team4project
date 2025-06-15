package com.example.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

                http.authorizeHttpRequests(authorize -> authorize
                                .requestMatchers("/", "/assets/**", "/css/**", "/js/**", "/upload/**").permitAll()
                                .requestMatchers("/movie/list", "/movie/read").permitAll()
                                .requestMatchers("/reviews/**", "/upload/display/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/member/register", "/member/login", "/error")
                                .permitAll()

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
}
