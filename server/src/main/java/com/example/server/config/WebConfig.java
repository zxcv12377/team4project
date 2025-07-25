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
                .allowCredentials(true); // ★ JSESSIONID 쿠키 허용
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
    }

    @PostConstruct
    public void init() {
        System.out.println("✅ allowedOrigins = " + allowedOrigins);
    }

}