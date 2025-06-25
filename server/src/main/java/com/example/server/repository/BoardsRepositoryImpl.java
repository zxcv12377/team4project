package com.example.server.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PagesRequestsDTO;
import com.example.server.entity.Boards;
import com.example.server.entity.QBoard;
import com.example.server.entity.QBoards;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;

public class BoardsRepositoryImpl implements BoardsRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QBoards board = QBoards.boards;

    public BoardsRepositoryImpl(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    @Override
    public Page<Boards> search(PagesRequestsDTO requestDTO, Pageable pageable) {

        BooleanBuilder builder = new BooleanBuilder();

        String type = requestDTO.getType();
        String keyword = requestDTO.getKeyword();

        if (type != null && keyword != null) {
            if (type.contains("t")) {
                builder.or(board.title.containsIgnoreCase(keyword));
            }
            if (type.contains("c")) {
                builder.or(board.content.containsIgnoreCase(keyword));
            }
            if (type.contains("w")) {
                builder.or(board.member.nickname.containsIgnoreCase(keyword));
            }
        }

        List<Boards> content = queryFactory
                .selectFrom(board)
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(board.createdDate.desc())
                .fetch();

        long count = queryFactory
                .select(board.count())
                .from(board)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, count);
    }
}
