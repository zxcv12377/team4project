package com.example.server.service;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2 //로깅 사용 가능 (log.info() 
@RequiredArgsConstructor // final 필드 기반 생성자 자동 생성 (DI 용)
@Service // Spring에서 비즈니스 로직을 담당하는 클래스임을 나타냄
public class BoardService {

//"BoardService"는 비즈니스 로직 수행 (DTO ↔ Entity 변환 포함).
// ： DTO는 화면과 서버 간 데이터 전달용이고, Entity는 DB 저장을 위한 객체이므로
//  저장하려면 DTO를 Entity로 변환필요

    //DB 연동을 위한 레포지토리 의존성 주입
    private final BoardRepository boardRepository;//게시글 관련 DB 작업
    private final MemberRepository memberRepository;
    private final ReplyRepository replyRepository;//댓글 관련 DB 작업 (게시글 삭제 시 댓글도 삭제)


    // １. Create [DTO → Entity → 저장]
    public Long create(BoardDTO dto) {
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        // 저장
        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();  // 저장 후 PK 반환
    }

    // 2. Delete [댓글과 함께 삭제]
    @Transactional // 두개의 테이블 접근(댓글,게시글) => 하나의 트랜잭션으로 한번에 처리, 오류 시 롤백
    public void delete(Long bno) {
        replyRepository.deleteByBoardBno(bno); //댓글 삭제
        boardRepository.deleteById(bno);//게시글 삭제
    }

    // 3. Update [Entity 조회 후 수정]
    public Long update(BoardDTO dto) {
        // 수정할 대상 찾기(Id 로 찾기)
        Board board = boardRepository.findById(dto.getBno()).orElseThrow(); //원본 게시글 조회
//orElseThrow(): ID로 찾은 게시글이 없을 경우 예외를 던져서 null 문제를 방지하고, 코드의 안정성을 높이기 위해 사용

        // 업데이트_title, contenet
        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContent());
        // 저장(JPA가 Dirty Checking으로 자동 반영 가능))
        boardRepository.save(board);

        return board.getBno();
    }

// 목록 전체 조회 (페이징 없이)
public List<BoardDTO> getList() {
    // 모든 게시글 조회 (댓글 수, 작성자 정보 함께 조회할 수 있도록 커스텀 쿼리 필요 시 QueryDSL 사용)
    List<Board> boardList = boardRepository.findAll(Sort.by(Sort.Direction.DESC, "bno"));

    // Board → BoardDTO 변환
    List<BoardDTO> dtoList = boardList.stream()
            .map(board -> entityToDto(board, board.getMember(), (long) board.getReplies().size()))
            .collect(Collectors.toList());

    return dtoList;
}



    //4. Read(단건 조회?)
public BoardDTO getRow(Long bno) {
    Board board = boardRepository.findById(bno).orElseThrow();
    return entityToDto(board, board.getMember(), (long) board.getReplies().size());
}


    // Entity → DTO 변환 메서드
    // Member 정보와 댓글 수도 함께 넣어줌
    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        BoardDTO dto = BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .id(member.getId())
                .nickname(member.getNickname())
                .replyCount(replyCount)
                .build();
        return dto;
    }
// DTO → Entity 변환 메서드
// DB에서 ID로 Member를 조회해서 연결
private Board dtoToEntity(BoardDTO dto) {
    Member member = memberRepository.findById(dto.getId())
            .orElseThrow(() -> new IllegalArgumentException("No member found with id: " + dto.getId()));

    Board board = Board.builder()
            .bno(dto.getBno())
            .title(dto.getTitle())
            .content(dto.getContent())
            .member(member) // 영속 상태 Member 객체
            .build();
    return board;
}


}
