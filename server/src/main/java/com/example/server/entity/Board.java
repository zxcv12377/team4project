package com.example.server.entity;

import java.util.List;

import com.example.server.base.Base;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Table(name = "BOARD")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "member", "replies" })
@Entity
public class Board extends Base {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bno;

    @Column(nullable = false)
    private String title;

    @Column(length = 32767)
    private String content;

    @Column(name = "attachments_json", length = 3000)
    private String attachmentsJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<Reply> replies;

    // 수정 메서드
    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void changeAttachments(String attachmentsJson) {
        this.attachmentsJson = attachmentsJson;
    }
}
