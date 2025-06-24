package com.example.server.service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;

public interface MemberService {

    void register(String email);

    MemberResponseDTO getUserInfo(String email);

    MemberResponseDTO updateUserInfo(String email, MemberRequestDTO dto);

    void updateComment(String email, String comment);

    void changePassword(String email, String currentPassword, String newPassword);

    void delete(String email);

    String getProfileImageFilename(String email); // 이전 이미지 확인용

    void updateProfileImage(String email, String profileimg); // 새 이미지 파일명 저장용

    Member getByEmail(String email);

    @Transactional(readOnly = true)
    public List<MemberResponseDTO> searchMembers(String name, Long myMno);
}
