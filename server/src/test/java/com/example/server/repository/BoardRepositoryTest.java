package com.example.server.repository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Commit;

import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;
import com.example.server.entity.enums.MemberRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

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
        List<Member> members = memberRepository.findAll();

        // 실제 이미지 주소
        List<String> imageSamples = List.of(
                "https://picsum.photos/id/0/5000/3333",
                "https://picsum.photos/id/1/5000/3333",
                "https://picsum.photos/id/2/5000/3333",
                "https://picsum.photos/id/3/5000/3333",
                "https://picsum.photos/id/4/5000/3333",
                "https://picsum.photos/id/5/5000/3334",
                "https://picsum.photos/id/6/5000/3333",
                "https://picsum.photos/id/7/4728/3168",
                "https://picsum.photos/id/8/5000/3333",
                "https://picsum.photos/id/9/5000/3269",
                "https://picsum.photos/id/10/2500/1667",
                "https://picsum.photos/id/11/2500/1667",
                "https://picsum.photos/id/12/2500/1667",
                "https://picsum.photos/id/13/2500/1667",
                "https://picsum.photos/id/14/2500/1667",
                "https://picsum.photos/id/15/2500/1667",
                "https://picsum.photos/id/16/2500/1667",
                "https://picsum.photos/id/17/2500/1667",
                "https://picsum.photos/id/18/2500/1667",
                "https://picsum.photos/id/19/5000/3333");

        Random random = new Random();

        IntStream.rangeClosed(1, 50).forEach(i -> {

            Member member = members.get(new Random().nextInt(members.size()));

            int imageCount = random.nextInt(6);
            List<String> selectedImages = new ArrayList<>();
            for (int j = 0; j < imageCount; j++) {
                selectedImages.add(imageSamples.get(random.nextInt(imageSamples.size())));
            }

            String attachmentsJson = null;
            try {
                attachmentsJson = new ObjectMapper().writeValueAsString(selectedImages);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }

            Board board = Board.builder()
                    .title("테스트 게시글 제목 " + i)
                    .content("이것은 테스트 게시글 내용입니다. 번호: " + i)
                    .attachmentsJson(attachmentsJson)
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
            Set<Long> used = new HashSet();

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