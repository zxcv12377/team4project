package com.example.server.dto;

import java.time.LocalDateTime;

import com.example.server.entity.Reply;

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
    // Board
    private Long bno;
    private String text;

    // Member
    private Long id;
    private String nickname;

    private Long parentRno;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    private boolean deleted;

    public static ReplyDTO fromEntity(Reply reply) {
        return ReplyDTO.builder()
                .rno(reply.getRno())
                .bno(reply.getBoard().getBno())
                .text(reply.getText())
                .id(reply.getMember().getId())
                .nickname(reply.getMember().getNickname())
                .parentRno(reply.getParent() != null ? reply.getParent().getRno() : null)
                .createdDate(reply.getCreatedDate())
                .deleted(reply.isDeleted())
                .build();
    }

}
