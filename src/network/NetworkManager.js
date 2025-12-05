import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, child, push, onDisconnect, onChildAdded } from "firebase/database";

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

    this.playerId = this.generatePlayerId();
    this.playerName = "Player";
    this.currentRoomId = null;
    this.isHost = false;
    this.roomRef = null;

    // Callbacks
    this.onRoomUpdate = null; // (roomData) => {}
    this.onGameStart = null;  // () => {}
  }

  generatePlayerId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
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
      if (roomData.status !== 'waiting') {
        return { success: false, error: "ゲームは既に始まっています" };
      }

      const players = roomData.players || {};
      const playerCount = Object.keys(players).length;

      if (playerCount >= 4) {
        return { success: false, error: "部屋は満員です" };
      }

      // Determine Index (0-3)
      const usedIndices = Object.values(players).map(p => p.index);
      let newIndex = -1;
      for (let i = 0; i < 4; i++) {
        if (!usedIndices.includes(i)) {
          newIndex = i;
          break;
        }
      }

      // Add Player
      const newPlayer = {
        name: playerName,
        id: this.playerId,
        index: newIndex,
        isHost: false,
        isReady: true
      };

      await update(ref(this.db, `rooms/${code}/players/${this.playerId}`), newPlayer);

      // Remove player on disconnect
      onDisconnect(ref(this.db, `rooms/${code}/players/${this.playerId}`)).remove();

      this.listenToRoom();
      return { success: true, index: newIndex };

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

    // Start Game
    await update(roomRef, { status: 'playing' });
  }

  // === Game Synchronization ===

  async setInitialState(state) {
    if (!this.currentRoomId) return;
    // State: { hands: [[card, ...], ...], turn: 0, round: 1 }
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
    // Push action to list
    const actionRef = push(ref(this.db, `rooms/${this.currentRoomId}/actions`));
    await set(actionRef, {
      ...action,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  subscribeToGameActions(callback) {
    if (!this.currentRoomId) return;
    const actionsRef = ref(this.db, `rooms/${this.currentRoomId}/actions`);

    onChildAdded(actionsRef, (snapshot) => {
      const action = snapshot.val();
      if (action) callback(action);
    });
  }
}
