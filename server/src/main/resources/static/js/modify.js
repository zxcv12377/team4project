// 삭제버튼 클릭 시 removeForm submit 하기

document.querySelector(".btn-danger").addEventListener("click", () => {
  document.querySelector("#removeForm").submit();
});
