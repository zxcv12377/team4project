package com.example.server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "chatroom_seq_gen")
    @SequenceGenerator(name = "chatroom_seq_gen", sequenceName = "chatroom_seq", allocationSize = 1)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String name; // 채팅방 이름 (중복불가) 가능여부는 나중에

    private String description; // 방 설명

    private int maxParticipants; // 채널 최대 인원

    @OneToMany(mappedBy = "room")
    private List<VoiceChatLog> logs;
    // (양방향 옵션)
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    private List<ChatMessageEntity> messages;

    // 채널 타입 (TEXT, VOICE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChannelType type; // TEXT, VOICE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomType roomType; // SERVER, DM

    // 채널이 속한 서버 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = true)
    private Server server;

    // DM 참여자 정보 (ex. 1:1이라면 두 명의 Member 연관)
    @Builder.Default
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DmMember> dmMemberships = new ArrayList<>();

    private String roomKey;

    @PrePersist
    public void setDefaultRoomKey() {
        if (this.roomKey == null) {
            this.roomKey = UUID.randomUUID().toString();
        }
    }

}
