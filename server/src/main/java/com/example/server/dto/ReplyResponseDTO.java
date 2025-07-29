package com.example.server.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.server.entity.Member;
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
public class ReplyResponseDTO {

    private Long rno;
    private String text;
    private String nickname;
    private LocalDateTime createdDate;
    private boolean deleted;
    private Long bno;

    private List<ReplyResponseDTO> children; // 대댓글 리스트

    private Long likeCount; // 추천 수

    private String badge; // 작성자, 관리자, null

    private boolean best; // 베스트 댓글

    private Long writerId;

    private boolean likedByCurrentMember;

    private boolean likedByMe;

    public ReplyResponseDTO(Reply reply) {
        this.rno = reply.getRno();
        this.text = reply.getText();
        this.nickname = reply.getMember().getNickname();
        this.createdDate = reply.getCreatedDate();
        this.children = new ArrayList<>();
    }

    public ReplyResponseDTO(Reply reply, Member me) {
        this(reply);
        // 1) 내가 쓴 댓글인지
        this.writerId = reply.getMember().getId();

        // 2) 내가 추천을 눌렀는지
        // Reply 엔티티에 likes 리스트가 매핑되어 있어야 합니다.
        this.likedByMe = reply.getLikes().stream()
                .anyMatch(like -> like.getMember().getId().equals(me.getId()));
    }
}
