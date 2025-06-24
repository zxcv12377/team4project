package com.example.server.repository;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.server.base.Base;
import com.example.server.entity.Board;
import com.example.server.entity.QBoard;
import com.example.server.entity.QMember;
import com.example.server.entity.QReply;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class SearchBoardRepositoryImpl extends QuerydslRepositorySupport implements SearchBoardRepository {

    public SearchBoardRepositoryImpl() {
        super(Board.class);
    }

    @Override
    public Page<Object[]> getBoardList(String type, String keyword, Pageable pageable) {
        log.info("SearchBoard");

        QBoard board = QBoard.board;
        QMember member = QMember.member;
        QReply reply = QReply.reply;

        // 1. 기본 쿼리 구성 (join 없이 지연 로딩 그대로 사용)
        JPQLQuery<Tuple> query = from(board)
                .leftJoin(board.member, member)
                .leftJoin(reply).on(reply.board.eq(board))
                .select(
                        board.bno,
                        board.title,
                        board.content,
                        board.regDate,
                        board.modDate,
                        member.id,
                        member.nickname,
                        member.email,
                        reply.count());

        // 2. WHERE 조건 추가
        if (type != null && keyword != null) {
            BooleanBuilder builder = new BooleanBuilder();
            if (type.contains("t")) {
                builder.or(board.title.contains(keyword));
            }
            if (type.contains("c")) {
                builder.or(board.content.contains(keyword));
            }
            if (type.contains("w")) {
                builder.or(member.nickname.contains(keyword));
            }
            query.where(builder);
        }

        // 3. GROUP BY: Oracle의 엄격한 규칙 대응을 위해 SELECT 필드 모두 포함
        query.groupBy(
                board.bno,
                board.title,
                board.content,
                board.regDate,
                board.modDate,
                member.id,
                member.nickname,
                member.email);

        // 4. 페이징 적용 + 결과 가져오기
        List<Tuple> resultList = getQuerydsl().applyPagination(pageable, query).fetch();

        // 5. Tuple -> Object[] 변환
        List<Object[]> results = resultList.stream()
                .map(t -> new Object[] {
                        t.get(board.bno),
                        t.get(board.title),
                        t.get(board.content),
                        t.get(board.regDate),
                        t.get(board.modDate),
                        t.get(member.id),
                        t.get(member.nickname),
                        t.get(member.email),
                        t.get(reply.count())
                })
                .collect(Collectors.toList());

        return PageableExecutionUtils.getPage(results, pageable, query::fetchCount);

    }

    @Override
    public Object[] getBoardRow(Long bno) {
        QBoard board = QBoard.board;
        QMember member = QMember.member;
        QReply reply = QReply.reply;

        // 기본 게시글 + 작성자 조인
        JPQLQuery<Board> query = from(board);
        query.leftJoin(member).on(board.member.eq(member));
        query.where(board.bno.eq(bno));

        // 현재 게시글의 댓글 수 서브쿼리
        JPQLQuery<Long> replyCount = JPAExpressions.select(reply.count())
                .from(reply)
                .where(reply.board.eq(board)); // 현재 게시글에 해당하는 댓글만 카운트
                                               // // board는 외부 쿼리의 별칭

        // 게시글, 작성자, 댓글 수 포함된 튜플
        JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);
        Tuple row = tuple.fetchFirst();
        return row != null ? row.toArray() : null;
    }

}
