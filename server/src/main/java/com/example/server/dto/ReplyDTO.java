package com.example.server.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyDTO {

    private Long rno;
    private String text;

    // Member
    private Long id;
    private String nickname;

    // Board
    private Long bno;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

}
