package com.example.server.entity;

import com.example.server.entity.enums.ChannelRole;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "member_id", "room_id" }))
public class ChannelMember {
    // 이중 조인 테이블 + 권한 컬럼(ENUM) + UNIQUE 제약

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 참여자(멤버)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 채널(방)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    // 권한 (ADMIN / USER)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChannelRole role;

    // 선택: mute, ban, 입장일, 상태 등
    private boolean muted;
    private boolean banned;

    private boolean speaking;

    // public void changeSpeaking(boolean speaking) {
    // this.speaking = speaking;
    // }

    // 관계 설명
    // Member 1: ChannelMember
    // ChatRoom 1:N ChannelMember
    // (즉, Member ↔ ChannelMember ↔ ChatRoom : N:M 연결)
    // (member_id, room_id) UNIQUE 제약 (중복 입장 불가)

}
