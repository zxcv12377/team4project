// package com.example.server.repository;

// import static org.junit.jupiter.api.Assertions.assertEquals;
// import static org.junit.jupiter.api.Assertions.assertFalse;
// import static org.junit.jupiter.api.Assertions.assertNotNull;
// import static org.junit.jupiter.api.Assertions.assertTrue;

// import java.time.LocalDateTime;

// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import
// org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.boot.test.mock.mockito.MockBean;
// import org.springframework.mail.javamail.JavaMailSender;

// import com.example.server.entity.Member;
// import com.example.server.security.entity.EmailVerificationToken;
// import com.example.server.service.EmailVerificationService;

// import jakarta.transaction.Transactional;

// @SpringBootTest
// @AutoConfigureMockMvc
// @Transactional
// class EmailVerificationServiceTest {

// @Autowired
// private EmailVerificationService emailVerificationService;

// @Autowired
// private EmailVerificationTokenRepository tokenRepository;

// @Autowired
// private MemberRepository memberRepository;

// @Test
// public void EmailCreate() {
// String email = "nhw2130050@gmail.com";

// Member member = Member.builder()
// .email(email)
// .password("encoded1234")
// .nickname("테스트유저")
// .agree(true)
// .emailVerified(false)
// .profileimg("default.png")
// .build();

// memberRepository.save(member);

// EmailVerificationToken token =
// emailVerificationService.sendVerificationEmail(email);

// assertNotNull(token);
// assertEquals(email, token.getEmail());
// }

// @Test
// public void EmailTest() {
// String email = "nhw2130050@gmail.com";

// Member member = Member.builder()
// .email(email)
// .password("pw")
// .nickname("인증테스트")
// .agree(true)
// .emailVerified(false)
// .profileimg("default.png")
// .build();

// memberRepository.save(member);

// EmailVerificationToken token =
// emailVerificationService.sendVerificationEmail(email);

// boolean result = emailVerificationService.verifyToken(token.getToken());

// assertTrue(result);

// Member updated = memberRepository.findByEmail(email).orElseThrow();
// assertTrue(updated.isEmailVerified());
// }

// @Test
// public void EmailVerifiedFail() {
// // given
// String email = "nhw2130050@gmail.com";

// Member member = Member.builder()
// .email(email)
// .password("pw")
// .nickname("만료유저")
// .agree(true)
// .emailVerified(false)
// .profileimg("default.png")
// .build();

// memberRepository.save(member);

// // 만료된 토큰 생성
// EmailVerificationToken expiredToken = EmailVerificationToken.builder()
// .email(email)
// .token("expired-token")
// .expiryDate(LocalDateTime.now().minusMinutes(1))
// .verified(false)
// .build();

// tokenRepository.save(expiredToken);

// boolean result = emailVerificationService.verifyToken("expired-token");

// assertFalse(result);

// Member updated = memberRepository.findByEmail(email).orElseThrow();
// assertFalse(updated.isEmailVerified());
// }

// }