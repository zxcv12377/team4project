package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface MemberService {

    void register(String email);

    MemberResponseDTO getUserInfo(String email);

    MemberResponseDTO updateUserInfo(String email, MemberRequestDTO dto);

    void changePassword(String email, String currentPassword, String newPassword);

    void delete(String email);

    String getProfileImageFilename(String email); // 이전 이미지 확인용

    void updateProfileImage(String email, String profileimg); // 새 이미지 파일명 저장용
}
