const roomUsers = new Map();

function addUserToRoom(roomId, socketId) {
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Set());
  roomUsers.get(roomId).add(socketId);
  return roomUsers.get(roomId).size;
}

function removeUserFromRoom(socketId) {
  for (const [roomId, users] of roomUsers.entries()) {
    if (users.has(socketId)) {
      users.delete(socketId);
      if (users.size === 0) roomUsers.delete(roomId);
      return { roomId, size: users.size };
    }
  }
  return null;
}

function findUserRoom(socketId) {
  for (const [roomId, users] of roomUsers.entries()) {
    if (users.has(socketId)) return roomId;
  }
  return null;
}

function getRoomUsers(roomId) {
  return roomUsers.get(roomId) || new Set();
}

module.exports = {
  roomUsers,
  addUserToRoom,
  removeUserFromRoom,
  findUserRoom,
  getRoomUsers,
};
