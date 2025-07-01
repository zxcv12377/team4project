package com.example.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.example.server.entity.enums.FriendStatus;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "friend", uniqueConstraints = @UniqueConstraint(columnNames = { "memberA_id", "memberB_id" }))
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberA_id", nullable = false)
    private Member memberA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberB_id", nullable = false)
    private Member memberB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendStatus status;

    private LocalDateTime createdAt;

    // (필요시 updatedAt 등 추가)
}
