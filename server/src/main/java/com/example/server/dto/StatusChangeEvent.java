package com.example.server.dto;

import java.io.Serializable;

import com.example.server.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class StatusChangeEvent implements Serializable {
    private String email;
    private UserStatus status; // "ONLINE" or "OFFLINE"
}