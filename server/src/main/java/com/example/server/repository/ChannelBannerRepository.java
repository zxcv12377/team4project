package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.ChannelBanner;

public interface ChannelBannerRepository extends JpaRepository<ChannelBanner, Long> {

    Optional<ChannelBanner> findByBoardChannelId(Long channelId);

    void deleteByBoardChannelId(Long channelId);

    boolean existsByBoardChannelId(Long channelId);
}
