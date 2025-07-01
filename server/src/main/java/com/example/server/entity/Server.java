package com.example.server.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "server")
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    // 서버 소유자 (필수 관계, fetch LAZY)
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "owner_id", nullable = false)
    // private Member owner;

    // 서버에 속한 멤버 목록 (ServerMember - 서버별 참여/권한)
    @Builder.Default
    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServerMember> members = new ArrayList<>();

    // 서버에 소속된 채널(채팅방) 목록
    @Builder.Default
    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatRoom> channels = new ArrayList<>();
}
