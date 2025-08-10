package com.example.server.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.example.server.base.Base;
import com.example.server.entity.enums.PinScope;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Table(name = "BOARD")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "member", "replies", "channel" })
@Entity
public class Board extends Base {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bno;

    @Column(nullable = false, length = 255)
    private String title;

    // @Column(length = 32767)
    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Member member;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<Reply> replies;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BoardChannel channel;

    @Column(columnDefinition = "TEXT")
    private String attachments; // JSON 문자열로 이미지 리스트 저장

    // 게시글 조회수
    @Builder.Default
    @Column(nullable = false)
    private Long viewCount = 0L;

    // 게시글 좋아요 수
    @Builder.Default
    @Column(nullable = false)
    private Long boardLikeCount = 0L;

    @Builder.Default
    @Column(name = "pinned", nullable = false)
    private boolean pinned = false; // true면 고정된 글

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "pin_scope", nullable = false, length = 16)
    private PinScope pinScope = PinScope.NONE; // NONE | CHANNEL | GLOBAL

    @Column(name = "pin_order")
    private Integer pinOrder; // 낮을수록 위에 정렬

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt; // 고정 시각
    // 수정 메서드

    public void pin(PinScope scope, Integer order) {
        if (scope == null || scope == PinScope.NONE) {
            // NONE이면 곧바로 해제 처리
            unpin();
            return;
        }
        this.pinned = true;
        this.pinScope = scope;
        this.pinOrder = order;
        this.pinnedAt = LocalDateTime.now();
    }

    public void unpin() {
        this.pinned = false;
        this.pinScope = PinScope.NONE;
        this.pinOrder = null;
        this.pinnedAt = null;
    }

    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }
}
