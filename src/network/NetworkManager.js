import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, child, push, onDisconnect, onChildAdded, remove } from "firebase/database";

// TODO: USER MUST UPDATE THIS CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDApOxz17VTsot6Ph5sVMDOJCflc1_lE7o",
  authDomain: "may-be-goita-online.firebaseapp.com",
  databaseURL: "https://may-be-goita-online-default-rtdb.firebaseio.com",
  projectId: "may-be-goita-online",
  storageBucket: "may-be-goita-online.firebasestorage.app",
  messagingSenderId: "774407878648",
  appId: "1:774407878648:web:a5014459d8ba834c4cc80d"
};

export class NetworkManager {
  constructor() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;
    } catch (e) {
      console.error("Firebase Init Error:", e);
      this.initialized = false;
    }

    this.playerId = this.getPlayerId();
    this.playerName = "Player";
    this.currentRoomId = null;
    this.isHost = false;
    this.roomRef = null;

    // Callbacks
    this.onRoomUpdate = null; // (roomData) => {}
    this.onGameStart = null;  // () => {}
  }

  getPlayerId() {
    let id = sessionStorage.getItem('goita_playerId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('goita_playerId', id);
    }
    return id;
  }

  resetPlayerId() {
    sessionStorage.removeItem('goita_playerId');
    this.playerId = this.getPlayerId();
    console.log("Player ID Reset:", this.playerId);
    return this.playerId;
  }

  generateRoomCode() {
    // Hiragana 4 chars
    const chars = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // === Room Management ===

  // === Room Management ===

  async createRoom(playerName) {
    if (!this.initialized) return { success: false, error: "Firebase not configured" };

    this.playerName = playerName;
    this.isHost = true;
    const code = this.generateRoomCode();
    this.currentRoomId = code;

    const roomData = {
      hostId: this.playerId,
      status: 'waiting', // waiting, playing
      players: {
        [this.playerId]: {
          name: playerName,
          id: this.playerId,
          index: 0, // Host is always 0 initially
          isHost: true,
          isReady: true
        }
      },
      settings: {
        mode: 'standard' // standard, 2vs2, etc
      }
    };

    try {
      this.roomRef = ref(this.db, 'rooms/' + code);
      await set(this.roomRef, roomData);

      // Remove on disconnect
      onDisconnect(this.roomRef).remove();

      this.listenToRoom();
      return { success: true, code: code };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  }

  async joinRoom(code, playerName) {
    if (!this.initialized) return { success: false, error: "Firebase not configured" };

    this.playerName = playerName;
    this.isHost = false;
    this.currentRoomId = code;

    const roomRef = ref(this.db, 'rooms/' + code);

    try {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        return { success: false, error: "部屋が見つかりません" };
      }

      const roomData = snapshot.val();
      if (roomData.status !== 'waiting' && roomData.status !== 'playing') {
        // Allow rejoin if playing?
        // For now, strict check unless we are rejoining.
      }

      const players = roomData.players || {};

      // Check if I am already in the room (Rejoin)
      let myIndex = -1;
      if (players[this.playerId]) {
        myIndex = players[this.playerId].index;
        console.log("Rejoining as Player", myIndex);
      } else {
        // New Join
        const playerCount = Object.keys(players).length;
        if (playerCount >= 4) {
          return { success: false, error: "部屋は満員です" };
        }

        if (roomData.status !== 'waiting') {
          return { success: false, error: "ゲームは既に始まっています" };
        }

        // Determine Index (0-3)
        const usedIndices = Object.values(players).map(p => p.index);
        for (let i = 0; i < 4; i++) {
          if (!usedIndices.includes(i)) {
            myIndex = i;
            break;
          }
        }
      }

      // Add/Update Player
      const newPlayer = {
        name: playerName,
        id: this.playerId,
        index: myIndex,
        isHost: false,
        isReady: true
      };

      await update(ref(this.db, `rooms/${code}/players/${this.playerId}`), newPlayer);

      // Remove player on disconnect
      onDisconnect(ref(this.db, `rooms/${code}/players/${this.playerId}`)).remove();

      this.listenToRoom();
      return { success: true, index: myIndex };


    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  }

  listenToRoom() {
    if (!this.currentRoomId) return;

    const roomRef = ref(this.db, 'rooms/' + this.currentRoomId);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (this.onRoomUpdate) this.onRoomUpdate(data);

        if (data.status === 'playing' && this.onGameStart) {
          if (!this.gameStarted) {
            this.gameStarted = true;
            this.onGameStart();
          }
        }
      } else {
        // Room deleted
        if (this.onRoomUpdate) this.onRoomUpdate(null);
      }
    });
  }

  async startGame() {
    if (!this.isHost || !this.currentRoomId) return;

    // Auto-fill with NPCs
    const roomRef = ref(this.db, 'rooms/' + this.currentRoomId);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const roomData = snapshot.val();
    const players = roomData.players || {};
    const usedIndices = Object.values(players).map(p => p.index);

    const updates = {};
    for (let i = 0; i < 4; i++) {
      if (!usedIndices.includes(i)) {
        const cpuId = `cpu_${Date.now()}_${i}`;
        updates[`players/${cpuId}`] = {
          name: `CPU ${i}`,
          id: cpuId,
          index: i,
          isHost: false,
          isReady: true,
          isCpu: true // Flag to identify CPU
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(roomRef, updates);
    }

    // Clear previous actions to prevent ghost replays
    await remove(ref(this.db, `rooms/${this.currentRoomId}/actions`));

    // Start Game
    await update(roomRef, { status: 'playing' });
  }

  async resetRoom() {
    if (!this.isHost || !this.currentRoomId) return;

    // Reset to waiting
    const updates = {};
    updates[`rooms/${this.currentRoomId}/status`] = 'waiting';
    updates[`rooms/${this.currentRoomId}/gameState`] = null;
    updates[`rooms/${this.currentRoomId}/actions`] = null;

    // Reset player ready flags
    const snapshot = await get(ref(this.db, `rooms/${this.currentRoomId}/players`));
    const players = snapshot.val() || {};
    Object.keys(players).forEach(key => {
      updates[`rooms/${this.currentRoomId}/players/${key}/isReadyForNextRound`] = false;
    });

    await update(ref(this.db), updates);
  }

  // === Game Synchronization ===

  async setInitialState(state) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `rooms/${this.currentRoomId}/gameState`), state);
  }

  subscribeToInitialState(callback) {
    if (!this.currentRoomId) return;
    const stateRef = ref(this.db, `rooms/${this.currentRoomId}/gameState`);
    onValue(stateRef, (snapshot) => {
      const state = snapshot.val();
      if (state) callback(state);
    });
  }

  async sendGameAction(action) {
    if (!this.currentRoomId) return;
    const actionRef = push(ref(this.db, `rooms/${this.currentRoomId}/actions`));
    await set(actionRef, {
      ...action,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  async getGameState() {
    if (!this.currentRoomId) return null;
    const snapshot = await get(ref(this.db, `rooms/${this.currentRoomId}/gameState`));
    return snapshot.val();
  }

  async getGameActions() {
    if (!this.currentRoomId) return [];
    const snapshot = await get(ref(this.db, `rooms/${this.currentRoomId}/actions`));
    const actions = snapshot.val();
    if (!actions) return [];
    return Object.values(actions);
  }

  subscribeToGameActions(callback) {
    if (!this.currentRoomId) return;
    const actionsRef = ref(this.db, `rooms/${this.currentRoomId}/actions`);

    onChildAdded(actionsRef, (snapshot) => {
      const action = snapshot.val();
      if (action) callback(action);
    });
  }

  // === Special Events (Shi Rules) ===

  async sendSpecialWin(condition) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `rooms/${this.currentRoomId}/specialWin`), condition);
  }

  async sendFiveShiEvent(condition) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `rooms/${this.currentRoomId}/fiveShi`), condition);
  }

  async sendRedeal() {
    if (!this.currentRoomId) return;
    // Clear special states and set redeal flag
    const updates = {};
    updates[`rooms/${this.currentRoomId}/fiveShi`] = null;
    updates[`rooms/${this.currentRoomId}/redeal`] = Date.now();
    await update(ref(this.db), updates);
  }

  subscribeToSpecialEvents(callbacks) {
    if (!this.currentRoomId) return;
    const roomRef = ref(this.db, `rooms/${this.currentRoomId}`);

    onValue(child(roomRef, 'specialWin'), (snapshot) => {
      const val = snapshot.val();
      if (val && callbacks.onSpecialWin) callbacks.onSpecialWin(val);
    });

    onValue(child(roomRef, 'fiveShi'), (snapshot) => {
      const val = snapshot.val();
      if (val && callbacks.onFiveShi) callbacks.onFiveShi(val);
    });

    onValue(child(roomRef, 'redeal'), (snapshot) => {
      const val = snapshot.val();
      if (val && callbacks.onRedeal) callbacks.onRedeal(val);
    });
  }

  // === Round Synchronization ===

  async setReadyForNextRound(isReady) {
    if (!this.currentRoomId) return;
    await update(ref(this.db, `rooms/${this.currentRoomId}/players/${this.playerId}`), {
      isReadyForNextRound: isReady
    });
  }

  async resetAllPlayersReady() {
    if (!this.currentRoomId) return;
    const snapshot = await get(ref(this.db, `rooms/${this.currentRoomId}/players`));
    const players = snapshot.val() || {};
    const updates = {};
    Object.keys(players).forEach(key => {
      updates[`players/${key}/isReadyForNextRound`] = false;
    });
    await update(ref(this.db, `rooms/${this.currentRoomId}`), updates);
  }

  waitForAllPlayersReady() {
    return new Promise((resolve) => {
      const playersRef = ref(this.db, `rooms/${this.currentRoomId}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        const players = snapshot.val() || {};
        const allReady = Object.values(players).every(p => {
          if (p.isCpu) return true; // Ignore CPU
          return p.isReadyForNextRound === true;
        });

        if (allReady) {
          unsubscribe(); // Stop listening
          resolve();
        }
      });
    });
  }
}
