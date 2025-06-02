package com.example.server.repository.search;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;

import com.example.server.entity.Board;
import com.fasterxml.jackson.databind.util.ArrayBuilders.BooleanBuilder;
import com.querydsl.jpa.JPQLQuery;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class SearchBoardRepositoryImpl extends QuerydslRepositorySupport implements SearchBoardRepository {

    public SearchBoardRepositoryImpl() {
        super(Board.class);
    }

    @Override
    public Page<Object[]> list(String type, String keyword, Pageable pageable) {
        log.info("SearchBoard");

        QBoard board = QBoard.board;
        QMember member = QMember.member;
        QReply reply = QReply.reply;

        JPQLQuery<Board> query = from(board);
        query.leftJoin(member).on(board.member.eq(member));

        // 댓글개수
        // r.BOARD_ID = b.BNO
        JPQLQuery<Tuple> tuple = query.select(
                board,
                member,
                JPAExpressions.select(reply.count())
                        .from(reply)
                        .where(reply.board.eq(board)));

        // JPQLQuery<Long> replyCount = JPAExpressions.select(reply.rno.count())
        // .from(reply)
        // .where(reply.board.eq(board)).groupBy(reply.board);

        // JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);

        log.info("===============");
        log.info(query);
        log.info("===============");

        // bno > 0
        booleanBuilder booleanBuilder = new BooleanBuilder();
        booleanBuilder.and(board.bno.gt(0L));

        if (type != null) {
            // 검색
            BooleanBuilder builder = new BooleanBuilder();
            if (type.contains("t")) {
                builder.or(board.title.contains(keyword));
            }
            if (type.contains("c")) {
                builder.or(board.content.contains(keyword));
            }
            if (type.contains("w")) {
                builder.or(board.member.name.contains(keyword));
            }
            booleanBuilder.and(builder);
        }

        tuple.where(booleanBuilder);

        // Sort 생성
        // PageRequest.of(0, 10, Sort.by("bno").descending());
        Sort sort = pageable.getSort();
        // sort 기준이 여러개 일 수 있어서
        sort.stream().forEach(order -> {
            // import com.querydsl.core.types.Order;
            Order direction = order.isAscending() ? Order.ASC : Order.DESC;

            String prop = order.getProperty();
            PathBuilder<Board> orderBuilder = new PathBuilder<>(Board.class, "board");
            tuple.orderBy(new OrderSpecifier(direction, ordeBuilder.get(prop)));
        });

        // ------------------- 전체 리스트 + Sort 적용

        // 페이지 처리
        tuple.offset(pageable.getOffset());
        // 10
        tuple.limit(pageable.getPageSize());

        List<Tuple> result = tuple.fetch();
        // 전체개수
        // long count = tuple.fetchCount();
        long count = query.clone().where(booleanBuilder).fetchCount();

        List<Object[]> list = result.stream().map(t -> t.toArray()).collect(Collectors.toList());

        return new PageImpl<>(list, pageable, count);
    }

    @Override
    public Object[] getBoardByBno(Long bno) {
        QBoard board = QBoard.board;
        QMember member = QMember.member;
        QReply reply = QReply.reply;

        JPQLQuery<Board> query = from(board);
        query.leftJoin(member).on(board.member.eq(member));
        query.where(board.bno.eq(bno));

        // 댓글개수
        // r.BOARD_ID = b.BNO
        JPQLQuery<Long> replyCount = JPAExpressions.select(reply.rno.count())
                .from(reply)
                .where(reply.board.eq(board)).groupBy(reply.board);

        JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);

        Tuple row = tuple.fetchFirst();
        return row.toArray();
    }
}
