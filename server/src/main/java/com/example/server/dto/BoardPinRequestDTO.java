package com.example.server.dto;

import com.example.server.entity.enums.PinScope;

import lombok.Data;

@Data
public class BoardPinRequestDTO {
    private PinScope scope; // NONE | CHANNEL | GLOBAL
    private Integer order; // 낮을수록 위
}