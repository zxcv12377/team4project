// 이미 있던 헬퍼를 확장
export const isAdmin = (user) => !!user?.roles?.includes("ADMIN");
export const isAuthor = (user, post) => !!user && Number(user?.id) === Number(post?.memberId);
export const isInquiryChannel = (channelOrType) => {
  const t = typeof channelOrType === "string" ? channelOrType : channelOrType?.type || channelOrType?.channelType;
  return String(t || "").toUpperCase() === "INQUIRY";
};

// INQUIRY 글을 열람 가능?
export const canViewInquiry = (user, postOrMeta, channelOrType) => {
  const inq = channelOrType ? isInquiryChannel(channelOrType) : isInquiryChannel(postOrMeta?.channelType);
  if (!inq) return true; // INQUIRY 아니면 모두 열람 가능
  return isAdmin(user) || isAuthor(user, postOrMeta);
};

// 리스트에서 마스킹용 DTO 변환(제목만 바꿔치기 + 표시용 플래그)
export const withInquiryMasking = (user, post, channelOrType) => {
  const canView = canViewInquiry(user, post, channelOrType);
  return canView
    ? { ...post, __masked: false, __displayTitle: post.title }
    : { ...post, __masked: true, __displayTitle: "비공개 게시글입니다" };
};
