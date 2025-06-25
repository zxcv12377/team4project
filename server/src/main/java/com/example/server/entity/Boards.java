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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Boards extends Base {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bno;

    private String title;

    @Column(length = 2000)
    private String content;

    private String attachmentsJson; // JSON 문자열로 첨부파일 저장

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    // 선택: 양방향 설정
    @OneToMany(mappedBy = "boards", cascade = CascadeType.ALL)
    private List<Reply> replies;

    public String getWriterName() {
        return member != null ? member.getNickname() : null;
    }

    public String getWriterUsername() {
        return member != null ? member.getEmail() : null;
    }

}
