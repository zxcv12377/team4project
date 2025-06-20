package com.example.server.security;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateChatRoomException.class)
    public ResponseEntity<?> handleDuplicateRoom(DuplicateChatRoomException ex) {
        // 409 상태코드 + JSON 에러 메시지
        return ResponseEntity
                .status(409)
                .body(Map.of("error", ex.getMessage()));
    }
}
