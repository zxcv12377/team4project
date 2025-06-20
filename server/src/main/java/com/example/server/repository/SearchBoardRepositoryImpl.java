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

import com.example.server.entity.Board;
import com.example.server.entity.QBoard;
import com.example.server.entity.QMember;
import com.example.server.entity.QReply;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.PathBuilder;
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

        JPQLQuery<Board> query = from(board);
        query.leftJoin(board.member, member);
        query.groupBy(board);

        if (type != null && keyword != null) {
            BooleanBuilder builder = new BooleanBuilder();
            if (type.contains("t")) {
                builder.or(board.title.contains(keyword));
            }
            query.where(builder);
        }

        // 댓글 개수 포함한 select
        JPQLQuery<Tuple> tupleQuery = query.select(board, member, reply.count());
        List<Tuple> resultList = getQuerydsl().applyPagination(pageable, tupleQuery).fetch();

        List<Object[]> results = resultList.stream()
                .map(t -> new Object[] { t.get(board), t.get(member), t.get(reply.count()) })
                .collect(Collectors.toList());

        return PageableExecutionUtils.getPage(results, pageable, tupleQuery::fetchCount);
        // // 댓글 개수
        // JPQLQuery<Long> replyCount = JPAExpressions.select(reply.rno.count())
        // .from(reply)
        // .where(reply.board.eq(reply.board));

        // JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);

        // log.info("===============");

        // log.info("===============");

        // // Sort 생성
        // Sort sort = pageable.getSort();
        // // sort 기준이 여러개 일 수 있어서
        // sort.stream().forEach(order -> {
        // // import com.querydsl.core.types.Order;
        // Order direction = order.isAscending() ? Order.ASC : Order.DESC;

        // String prop = order.getProperty();
        // PathBuilder<Board> ordeBuilder = new PathBuilder<>(Board.class, "board");
        // tuple.orderBy(new OrderSpecifier(direction, ordeBuilder.get(prop)));
        // });

        // // 페이지 처리
        // tuple.offset(pageable.getOffset());
        // // 10
        // tuple.limit(pageable.getPageSize());
        // // 전체개수
        // long count = tuple.fetchCount();

        // List<Tuple> result = tuple.fetch();

        // List<Object[]> list = result.stream().map(t ->
        // t.toArray()).collect(Collectors.toList());

        // return new PageImpl<>(list, pageable, count);
    }

    @Override
    public Object[] getBoardRow(Long bno) {
        QBoard board = QBoard.board;
        QMember member = QMember.member;
        QReply reply = QReply.reply;

        JPQLQuery<Board> query = from(board);
        query.leftJoin(member).on(board.member.eq(member));
        query.where(board.bno.eq(bno));

        JPQLQuery<Long> replyCount = JPAExpressions.select(reply.rno.count())
                .from(reply)
                .where(reply.board.eq(board)).groupBy(reply.board);

        JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);
        Tuple row = tuple.fetchFirst();

        return row.toArray();
    }
    // @Override
    // public Page<Object[]> getTotalList(String type, String keyword, Pageable
    // pageable) {
    // QBoard board = QBoard.board;
    // QMember member = QMember.member;
    // QReply reply = QReply.reply;

    // JPQLQuery<Board> query = from(board);
    // query.leftJoin(board.member, member);
    // query.groupBy(board);

    // if (type != null && keyword != null) {
    // BooleanBuilder builder = new BooleanBuilder();
    // if (type.contains("t")) {
    // builder.or(board.title.contains(keyword));
    // }
    // query.where(builder);
    // }

    // // 댓글 개수 포함한 select
    // JPQLQuery<Tuple> tupleQuery = query.select(board, member, reply.count());
    // List<Tuple> resultList = getQuerydsl().applyPagination(pageable,
    // tupleQuery).fetch();

    // List<Object[]> results = resultList.stream()
    // .map(t -> new Object[] { t.get(board), t.get(member), t.get(reply.count()) })
    // .collect(Collectors.toList());

    // return PageableExecutionUtils.getPage(results, pageable,
    // tupleQuery::fetchCount);
    // }

}
