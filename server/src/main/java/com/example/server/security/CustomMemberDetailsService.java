package com.example.server.security;

import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
<<<<<<< HEAD
=======
import lombok.extern.log4j.Log4j2;

>>>>>>> 506068dc6a91cc0510b3fd11b34ca7d294aa2924
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

<<<<<<< HEAD
=======
@Log4j2
>>>>>>> 506068dc6a91cc0510b3fd11b34ca7d294aa2924
@Service
@RequiredArgsConstructor
public class CustomMemberDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 사용자입니다: " + email));
<<<<<<< HEAD
        return new CustomMemberDetails(member);
=======
                log.info("[CustomMemberDetailsService] DB에서 가져온 사용자 email: {}", member.getEmail());
        
                if (!member.isEmailVerified()) {
            throw new RuntimeException("이메일 인증이 완료되지 않았습니다.");
        }
                return new CustomMemberDetails(member);
>>>>>>> 506068dc6a91cc0510b3fd11b34ca7d294aa2924
    }
}
