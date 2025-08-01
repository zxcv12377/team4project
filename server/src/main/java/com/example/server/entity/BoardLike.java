package com.example.server.entity;

import com.example.server.base.Base;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Table(name = "board_like", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "board_id", "member_id" }) // 중복 방지
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class BoardLike extends Base {
    // 현재 Board에 있는 boardLikeCount는 단순 캐싱용 (수만 저장)
    // 좋아요 관계는 BoardLike 테이블에서 관리
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

}
