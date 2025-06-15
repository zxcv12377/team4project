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
import lombok.ToString;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor 
@ToString(exclude = {"member", "replies"})
@Entity 
public class Board extends Base {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    
    private Long bno; //게시판 번호

    private String title; //게시글 제목

    //게시글 내용(최대 2000자 저장 가능)
    @Column(length = 2000)
    private String content; 

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    // 선택: 양방향 설정
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<Reply> replies;

    public void changeTitle(String title) {
    this.title = title; 

}

public void changeContent(String content) {
    this.content = content;
}

}
