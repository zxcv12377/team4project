package com.example.server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;

import com.example.server.base.Base;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "boards", "parent", "member" })

public class Reply extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_bno")
    private Boards boards;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_rno")
    private Reply parent;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    @Column(nullable = false)
    private String text;

    @Column(nullable = true)
    @Builder.Default
    private boolean deleted = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Reply> children = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "reply", cascade = CascadeType.ALL)
    private List<ReplyLike> likes = new ArrayList<>();

    public void softDelete() {
        this.deleted = true;
        this.text = "삭제된 댓글입니다";
    }

    public void updateText(String newText) {
        this.text = newText;
    }
}
