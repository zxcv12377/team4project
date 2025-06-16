package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface MemberService {

    void register(MemberRequestDTO dto);

    MemberResponseDTO getUserInfo(String email);

    MemberResponseDTO updateUserInfo(String email, MemberRequestDTO dto, MultipartFile profile);

    void changePassword(String email, String currentPassword, String newPassword);

    void delete(String email);
}
