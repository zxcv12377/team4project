package com.example.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invite")
public class Invite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 16, unique = true, nullable = false)
    private String code; // 초대코드

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Server server; // 초대 대상 방

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Member creator; // 코드 생성자

    private LocalDateTime createdAt;

    private LocalDateTime expireAt; // 만료시각 (null이면 무제한)

    private Integer maxUses; // 최대 사용가능횟수 (null이면 무제한)

    @Builder.Default
    private Integer uses = 0; // 현재 사용된 횟수

    @Builder.Default
    private Boolean active = true; // 활성/폐기 여부

    private String memo; // (옵션) 라벨/설명

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.uses == null)
            this.uses = 0;
        if (this.active == null)
            this.active = true;
    }
}
