const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const GameManager = require("./gameManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const gameManager = new GameManager();

io.on("connection", (socket) => {
  console.log("새 유저 접속:", socket.id);

  // 방 생성
  socket.on("createRoom", ({ name }, callback) => {
    const roomCode = gameManager.createRoom(socket.id, name);
    socket.join(roomCode);
    callback({ roomCode });
    io.to(roomCode).emit("updatePlayers", gameManager.getRoom(roomCode).players);
  });

  // 방 참가
  socket.on("joinRoom", ({ roomCode, name }, callback) => {
    const success = gameManager.addPlayer(roomCode, socket.id, name);
    if (!success) {
      callback({ error: "방이 존재하지 않습니다." });
      return;
    }
    socket.join(roomCode);
    callback({ success: true });
    io.to(roomCode).emit("updatePlayers", gameManager.getRoom(roomCode).players);
  });

  // 게임 시작
  socket.on("startGame", ({ roomCode, maxRounds, titles }) => {
    const firstTitle = gameManager.startGame(roomCode, maxRounds, titles);
    io.to(roomCode).emit("gameStarted", { title: firstTitle });
  });

  // 투표 처리
  socket.on("submitVotes", ({ roomCode, votes }) => {
    const result = gameManager.calculateVotes(roomCode, votes);
    io.to(roomCode).emit("voteResult", result);

    // 다음 라운드로 진행
    const nextTitle = gameManager.nextRound(roomCode);
    if (nextTitle) {
      io.to(roomCode).emit("nextRound", { title: nextTitle });
    } else {
      const room = gameManager.getRoom(roomCode);
      io.to(roomCode).emit("gameEnded", { scores: room.players });
    }
  });

  socket.on("disconnect", () => {
    console.log("연결 해제:", socket.id);
    // TODO: 플레이어 제거 로직 추가 가능
  });
});

// 점수판 관리
let scores = {}; // { socketId: { name: '승현', score: 0 } }

// 투표 결과 처리
function calculateResults(votes) {
  // votes: { voterId: targetId, ... }

  // 지목당한 횟수 집계
  let count = {};
  for (let voterId in votes) {
    let targetId = votes[voterId];
    if (!count[targetId]) count[targetId] = 0;
    count[targetId]++;
  }

  // 가장 많이 지목된 사람 찾기
  let maxVotes = Math.max(...Object.values(count));
  let mvpCandidates = Object.keys(count).filter(id => count[id] === maxVotes);
  let mvpId = mvpCandidates[0]; // 동점일 경우 첫 번째만 MVP (단순화)

  // 점수 계산
  let totalPlayers = Object.keys(scores).length;
  for (let voterId in votes) {
    let targetId = votes[voterId];

    // 모든 사람이 같은 사람을 지목했을 경우
    if (count[targetId] === totalPlayers - 1) {
      scores[targetId].score += 3;
    } else {
      if (targetId === mvpId) {
        scores[targetId].score += 2;
        scores[voterId].score += 1;
      }
    }
  }

  // 점수 정렬
  let scoreboard = Object.values(scores).sort((a, b) => b.score - a.score);

  return {
    mvp: scores[mvpId].name,
    scoreboard: scoreboard.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      score: p.score
    }))
  };
}


server.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
});
