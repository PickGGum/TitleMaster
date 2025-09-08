const socket = io();

// 서버에서 라운드 결과 받기
socket.on("roundResults", (data) => {
  // data 예시:
  // {
  //   mvp: "승현",
  //   scoreboard: [
  //     { rank: 1, name: "승현", score: 8 },
  //     { rank: 2, name: "민수", score: 6 },
  //     { rank: 3, name: "지훈", score: 4 }
  //   ]
  // }

  // MVP 표시
  document.getElementById("mvpName").innerText = data.mvp;

  // 순위표 초기화
  const scoreboardBody = document.getElementById("scoreboard");
  scoreboardBody.innerHTML = "";

  // 순위표 채우기
  data.scoreboard.forEach((player) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-2">${player.rank}</td>
      <td class="p-2">${player.name}</td>
      <td class="p-2">${player.score}</td>
    `;
    scoreboardBody.appendChild(row);
  });

  // 모달 열기
  document.getElementById("resultsModal").classList.remove("hidden");
  document.getElementById("resultsModal").classList.add("flex");
});

// "다음 라운드" 버튼 클릭 시 서버에 알림 보내기
document.getElementById("nextRoundBtn").addEventListener("click", () => {
  socket.emit("nextRound");
  // 모달 닫기
  document.getElementById("resultsModal").classList.add("hidden");
  document.getElementById("resultsModal").classList.remove("flex");
});
