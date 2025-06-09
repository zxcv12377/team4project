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
@AllArgsConstructor //@AllArgsConstructor
@ToString(exclude = "member")
//Lombok이 클래스의 모든 필드를 문자열로 나열하는 toString() 메서드를 자동 생성해주는 애노테이션
//LAZY 관계일 때 >  순환 호출 (StackOverflowError) 막기 위함.  
@Entity //JPA의 엔티티 클래스임을 나타냄 (DB 테이블과 매핑)
public class Board extends Base {

    @Id //기본 키(primary key)
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    //DB에서 자동 증가되도록 설정 (IDENTITY: MySQL의 auto_increment 방식)
    private Long bno; //게시판 번호

    private String title; //게시글 제목

    //게시글 내용(최대 2000자 저장 가능)
    @Column(length = 2000)
    private String content; 

    //ManyToOne : 내(Board)가 여러 개 중 하나(의 맴버)에 속한다
// 다대일 연관관계 (Board는 N : 1인 Member)
// 게시글은 한 명의 작성자(Member)와 연결
// fetch = LAZY: 실제로 접근할 때만 member 조회 (성능 최적화)
    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    // 선택: 양방향 설정
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<Reply> replies;
// 하나의 게시글이 여러 댓글(Reply)을 가질 수 있음 (1:N)
// mappedBy = "board": Reply 쪽의 board 필드에 의해 매핑됨
// cascade = CascadeType.ALL: 게시글 삭제 시 댓글도 자동 삭제


// 수정 시 사용하는 setter 역할의 메서드
// 추후 service 계층에서 게시글 제목/내용만 수정할 때 사용
public void changeTitle(String title) {
    this.title = title; //this는 현재 객체 자기 자신을 가리키는 참조
    // = 현재 객체의 title 필드에, 메서드 매개변수로 받은 title 값을 대입


// this.title → 클래스의 멤버 변수
// title → 메서드의 매개변수
}

public void changeContent(String content) {
    this.content = content;
}

    // 작성자 이름 반환
    // public String getWriterName() {
    // return member != null ? member.getName() : null;
    // }

    // public String getWriterUsername() {
    // return member != null ? member.getUsername() : null;
    // }


}
