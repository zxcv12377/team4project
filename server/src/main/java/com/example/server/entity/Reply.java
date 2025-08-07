package com.example.server.entity;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.example.server.base.Base;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "REPLY")
@ToString(exclude = { "board", "parent", "member" })

public class Reply extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_bno", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_rno", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Reply parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Member member;

    @Column(nullable = false)
    private String text;

    @ManyToOne(fetch = FetchType.LAZY)
    private BoardChannel channel;

    @Column(nullable = true)
    @Builder.Default
    private boolean deleted = false;

    @Builder.Default
    private boolean best = false;

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

    @PostConstruct
    public void init() {
        System.out.println("✅ Reply entity loaded");
    }

}
