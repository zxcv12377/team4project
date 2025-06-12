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

    @Test
    public void insertMemberTest() {
        IntStream.rangeClosed(1, 10).forEach(i -> {
            Member member = Member.builder()
                    .email("user" + i + "@gmail.com")
                    .password("1111")
                    .nickname("user" + i)
                    .agree(true)
                    .emailVerified(true)
                    .profileimg("/img/default.png")
                    .build();

            member.addMemberRole(MemberRole.USER);

            memberRepository.save(member);

        });
    }

    @Test
    public void insertBoardTest() {
        IntStream.rangeClosed(1, 20).forEach(i -> {
            // 1~10번 member 순환 (10명)
            Long memberId = (long) ((i - 1) % 10 + 1);

            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));

            Board board = Board.builder()
                    .title("테스트 게시글 제목 " + i)
                    .content("이것은 테스트 게시글 내용입니다. 번호: " + i)
                    .member(member)
                    .build();

            boardRepository.save(board);
        });
    }

    @Test
    public void insertRepliesTest() {
        List<Member> members = memberRepository.findAll();
        List<Board> boards = boardRepository.findAll();

        IntStream.rangeClosed(1, 100).forEach(i -> {
            Member member = members.get(i % members.size());
            Board board = boards.get(i % boards.size());

            Reply reply = Reply.builder()
                    .text("댓글 내용 " + i)
                    .member(member)
                    .board(board)
                    .build();

            replyRepository.save(reply);
        });
    }

    @Test
    public void insertReplyChildrenTest() {
        List<Member> members = memberRepository.findAll();
        List<Reply> parentReplies = replyRepository.findAll()
                .stream()
                .filter(reply -> reply.getParent() == null)
                .toList(); // 부모 댓글만 필터링

        IntStream.rangeClosed(1, 50).forEach(i -> {
            Member member = members.get(i % members.size());
            Reply parent = parentReplies.get(i % parentReplies.size());

            Reply child = Reply.builder()
                    .text("대댓글 내용 " + i)
                    .member(member)
                    .board(parent.getBoard()) // 같은 게시글로 설정
                    .parent(parent)
                    .build();

            replyRepository.save(child);
        });
    }

    @Test
    public void insertReplyLikesTest() {
        List<Member> members = memberRepository.findAll();
        List<Reply> replies = replyRepository.findAll();

        Random random = new Random();

        int totalLikes = 0;

        for (Reply reply : replies) {
            int likeCount = random.nextInt(4); // 댓글 하나당 0~3명 추천
            Set<Long> used = new HashSet<>();

            for (int i = 0; i < likeCount; i++) {
                int memberIdx;

                // 중복 추천 방지
                do {
                    memberIdx = random.nextInt(members.size());
                } while (used.contains((long) memberIdx));
                used.add((long) memberIdx);

                Member member = members.get(memberIdx);

                // 추천 기록 저장
                ReplyLike replyLike = ReplyLike.builder()
                        .reply(reply)
                        .member(member)
                        .build();

                replyLikeRepository.save(replyLike);
                totalLikes++;
            }
        }
    }

    @Test
    public void verifyReplyLikeCountsTest() {
        List<Reply> replies = replyRepository.findAll();

        for (Reply reply : replies) {
            Long count = replyLikeRepository.countByReply(reply);
            System.out.println("댓글 rno = " + reply.getRno() + ", 추천 수 = " + count);
        }
    }

    @Test
    public void deleteReplyByIdTest() {
        Long targetRno = 100L; // 삭제할 댓글 rno (존재하는 ID를 넣어야 합니다)

        boolean existsBefore = replyRepository.existsById(targetRno);
        System.out.println("삭제 전 존재 여부: " + existsBefore);

        replyRepository.deleteById(targetRno);

        boolean existsAfter = replyRepository.existsById(targetRno);
        System.out.println("삭제 후 존재 여부: " + existsAfter);
    }
}
