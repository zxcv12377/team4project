package com.example.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import jakarta.annotation.PostConstruct;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 프론트엔드에서 호출할 API 경로
                .allowedOrigins(allowedOrigins) // React 개발 서버 주소
                .allowedMethods("*") // GET, POST, PUT 등
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true) // ★ JSESSIONID 쿠키 허용
                .maxAge(3600); // 1시간
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String path = "file:" + System.getProperty("user.dir") + "/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(path);

        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations(path);
    }

    @PostConstruct
    public void init() {
        System.out.println("✅ allowedOrigins = " + allowedOrigins);
        System.out.println("📁 현재 작업 디렉토리 (user.dir): " + System.getProperty("user.dir"));
    }
}