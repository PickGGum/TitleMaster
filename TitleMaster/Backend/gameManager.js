// 게임 전체 로직과 상태를 관리하는 클래스
class GameManager {
    constructor() {
      this.rooms = {}; // roomCode -> { hostId, players, round, maxRounds, titles }
    }
  
    // 방 생성
    createRoom(hostId, hostName) {
      const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      this.rooms[roomCode] = {
        hostId,
        players: {}, // socketId -> { name, score }
        round: 0,
        maxRounds: 0,
        titles: []
      };
      this.rooms[roomCode].players[hostId] = { name: hostName, score: 0 };
      return roomCode;
    }
  
    // 플레이어 추가
    addPlayer(roomCode, socketId, name) {
      if (!this.rooms[roomCode]) return false;
      this.rooms[roomCode].players[socketId] = { name, score: 0 };
      return true;
    }
  
    // 라운드 시작
    startGame(roomCode, maxRounds, titles) {
      if (!this.rooms[roomCode]) return;
      this.rooms[roomCode].maxRounds = maxRounds;
      this.rooms[roomCode].titles = titles;
      this.rooms[roomCode].round = 1;
      return this.rooms[roomCode].titles[0];
    }
  
    // 투표 처리 및 점수 계산
    calculateVotes(roomCode, votes) {
      // votes: { voterId: votedPlayerId }
      const room = this.rooms[roomCode];
      if (!room) return null;
  
      const tally = {}; // votedPlayerId -> [voterIds]
      for (const voterId in votes) {
        const votedId = votes[voterId];
        if (!tally[votedId]) tally[votedId] = [];
        tally[votedId].push(voterId);
      }
  
      // 가장 많이 지목된 사람 찾기
      let maxVotes = 0;
      let chosenId = null;
      for (const [id, voters] of Object.entries(tally)) {
        if (voters.length > maxVotes) {
          maxVotes = voters.length;
          chosenId = id;
        }
      }
  
      if (!chosenId) return null;
  
      const voters = tally[chosenId];
      const allOthers = Object.keys(room.players).filter(pid => pid !== chosenId);
  
      if (voters.length === allOthers.length) {
        // 전원 지목 → 그 사람만 3점
        room.players[chosenId].score += 3;
      } else {
        // 지목된 사람 2점, 지목한 사람들 1점
        room.players[chosenId].score += 2;
        voters.forEach(voterId => {
          room.players[voterId].score += 1;
        });
      }
  
      return {
        chosenId,
        voters,
        scores: room.players
      };
    }
  
    // 다음 라운드로 진행
    nextRound(roomCode) {
      const room = this.rooms[roomCode];
      if (!room) return null;
  
      if (room.round < room.maxRounds) {
        room.round += 1;
        return room.titles[room.round - 1];
      } else {
        return null; // 게임 종료
      }
    }
  
    getRoom(roomCode) {
      return this.rooms[roomCode];
    }
  }
  
  module.exports = GameManager;
  
