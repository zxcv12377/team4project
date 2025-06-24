package com.example.server.repository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.MemberRole;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;

import jakarta.transaction.Transactional;

@SpringBootTest
public class BoardRepositoryTest {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ReplyRepository replyRepository;

    @Autowired
    private ReplyLikeRepository replyLikeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void insertMemberTest() {
        IntStream.rangeClosed(1, 10).forEach(i -> {
            Member member = Member.builder()
                    .email("user" + i + "@gmail.com")
                    .password(passwordEncoder.encode("1111"))
                    .nickname("user" + i)
                    .agree(false)
                    .emailVerified(false)
                    .profileimg(null)
                    .roles(Set.of(MemberRole.USER))
                    .build();

            memberRepository.save(member);

        });
    }

    @Test
    public void insertBoardTest() {

        IntStream.rangeClosed(1, 20).forEach(i -> {
            int rand = (int) (Math.random() * 10) + 1;
            Long lRand = Long.valueOf(rand);
            Member member = memberRepository.findById(lRand).orElseThrow();

            Board board = Board.builder()
                    .title("테스트 게시글 제목 " + i)
                    .content("이것은 테스트 게시글 내용입니다. 번호: " + i)
                    .member(member)
                    .build();

            boardRepository.save(board);
        });
    }

    @Test
    public void getBoardRowTest() {
        Object[] result = boardRepository.getBoardRow(1L);
        System.out.println(result);
    }

}
