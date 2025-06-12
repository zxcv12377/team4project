package com.example.server.repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;

import jakarta.transaction.Transactional;

@SpringBootTest
public class BoardRepositoryTest {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ReplyRepository replyRepository;

    @Test
    public void insertMemberTest() {
        IntStream.rangeClosed(1, 10).forEach(i -> {
            Member member = Member.builder()
                    .email("user" + i + "@gmail.com")
                    .password("1111")
                    .nickname("user" + i)
                    .agree(true)
                    .emailVerified(true)
                    .build();

            memberRepository.save(member);

            
        });
    }

    @Test
    public void insertBoardTest() {
        IntStream.rangeClosed(1, 20).forEach(i -> {

   Member member = Member.builder()
                .email("user" + i + "@gmail.com")
                .password("1111")
                .nickname("user" + i)
                .agree(true)
                .emailVerified(true)
                .build();

    Member savedMember = memberRepository.save(member);
 
            Board board = Board.builder()
                    .title("Board Title" + i)
                    .content("Board Content" + i)
                    .member(savedMember)
                    .build();

            boardRepository.save(board);
        });
    }

    // @Test
    // public void insertReplyTest() {
    // IntStream.rangeClosed(1, 50).forEach(i -> {

    // long no = (int) (Math.random() * 50) + 1;
    // Optional<Board> board = boardRepository.findById(null);

    // int id = (int) (Math.random() * 10) + 1;
    // Member member = memberRepository.findByNickname("user" + id);

    // Reply reply = Reply.builder()
    // .text("Test Reply..." + i)
    // .member(member)
    // .board()
    // .build();

    // replyRepository.save(reply);
    // });
    // }

    // @Test
    // public void updateBoardTest() {
    //     // 게시글 번호 3번을 업데이트한다고 가정
    //     Board board = boardRepository.findByBno(3L);
    //     if (board != null) {
    //         board.changeTitle("Updated Title");
    //         board.changeContent("Updated Content");
    //         boardRepository.save(board);
    //     }
    // }

    @Test
    public void deleteBoardTest() {
        // 게시글 번호 3번을 삭제
        Long bno = 3L;

        if (boardRepository.existsById(bno)) {
            boardRepository.deleteById(bno);
            System.out.println("Deleted board with bno: " + bno);
        } else {
            System.out.println("Board not found for bno: " + bno);
        }
    }

    @Test
    public void readBoardTest() {
        boardRepository.findById(3L);
    }

    @Test
    // @Transactional
    public void removeBoardTest() {
        boardRepository.deleteById(20L);
    }


//QUERY DSL
@Test
public void listTest(){
List<Object[]> result = boardRepository.list();
for ( Object[] objects : result ){
  Board board =   (Board)objects[0];   
  Member member =   (Member)objects[1];   
  Long replyCnt =   (Long)objects[2];   

System.out.println(board);
System.out.println(member);
System.out.println(replyCnt);

        }
    }
}
