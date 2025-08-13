package com.example.server.service;

import com.example.server.dto.BoardChannelDTO;

import com.example.server.entity.BoardChannel;
import com.example.server.repository.BoardChannelRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardChannelService {

    private final BoardChannelRepository repository;

    /* 목록 */
    public List<BoardChannelDTO> list() {
        return repository.findAll().stream()
                .map(BoardChannelDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /* 단건 조회 */
    public BoardChannelDTO get(Long id) {
        BoardChannel channel = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("채널이 존재하지 않습니다. id=" + id));
        return BoardChannelDTO.fromEntity(channel);
    }

    // 채널 이름조회
    public BoardChannelDTO getByName(String channelName) {
        return repository.findByName(channelName)
                .map(BoardChannelDTO::fromEntity)
                .orElseThrow(() -> new NoSuchElementException("채널이 존재하지 않습니다. name=" + channelName));
    }

    /* 생성 */
    public BoardChannelDTO create(BoardChannelDTO dto) {
        BoardChannel saved = repository.save(dto.toEntity());
        return BoardChannelDTO.fromEntity(saved);
    }

    /* 수정 */
    public BoardChannelDTO update(Long id, BoardChannelDTO dto) {
        BoardChannel channel = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("채널이 존재하지 않습니다. id=" + id));

        channel.setName(dto.getName());
        channel.setDescription(dto.getDescription());

        return BoardChannelDTO.fromEntity(channel); // flush 자동
    }

    /* 삭제 */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("채널이 존재하지 않습니다. id=" + id);
        }
        repository.deleteById(id);
    }
}
