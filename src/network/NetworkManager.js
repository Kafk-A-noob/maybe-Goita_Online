import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, child, push, onDisconnect, onChildAdded, remove } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export class NetworkManager {
  constructor() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.auth = getAuth(this.app);
      this.initialized = true;
    } catch (e) {
      console.error("Firebase Init Error:", e);
      this.initialized = false;
    }

    this.playerId = null;
    this.hostId = null; // CPUロジック用ホストUID
    this.playerName = "Player";
    this.currentRoomId = null;
    this.isHost = false;
    this.roomRef = null;

    // コールバック
    this.onRoomUpdate = null; // (roomData) => {}
    this.onGameStart = null;  // () => {}

    this.initAuth();
  }

  initAuth() {
    if (!this.initialized) return;
    signInAnonymously(this.auth).catch((error) => {
      console.error("Auth Failed", error);
    });

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.playerId = user.uid;
        console.log("Authenticated as:", this.playerId);
      } else {
        this.playerId = null;
      }
    });
  }

  async waitForAuth() {
    if (this.playerId) return this.playerId;
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.playerId = user.uid;
          unsubscribe();
          resolve(user.uid);
        }
      });
    });
  }

  generateRoomCode() {
    const chars = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // === 部屋管理 ===

  async createRoom(playerName) {
    if (!this.initialized) return { success: false, error: "Firebase not configured" };
    await this.waitForAuth();

    this.playerName = playerName;
    this.isHost = true;
    this.hostId = this.playerId;
    const code = this.generateRoomCode();
    this.currentRoomId = code;

    const roomData = {
      hostId: this.playerId,
      status: 'waiting',
      players: {
        [this.playerId]: {
          name: playerName,
          id: this.playerId,
          index: 0,
          isHost: true,
          isReady: true
        }
      },
      settings: { mode: 'standard' },
      // 初期書き込み用にホストの手番とする
      turn: this.playerId
    };

    try {
      this.roomRef = ref(this.db, 'games/' + code);
      await set(this.roomRef, roomData);

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
    await this.waitForAuth();

    this.playerName = playerName;
    this.isHost = false;
    this.currentRoomId = code;

    const roomRef = ref(this.db, 'games/' + code);

    try {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        return { success: false, error: "部屋が見つかりません" };
      }

      const roomData = snapshot.val();
      this.hostId = roomData.hostId;

      if (roomData.status !== 'waiting' && roomData.status !== 'playing') {
        // ...
      }

      const players = roomData.players || {};

      let myIndex = -1;
      if (players[this.playerId]) {
        myIndex = players[this.playerId].index;
        console.log("Rejoining as Player", myIndex);
      } else {
        const playerCount = Object.keys(players).length;
        if (playerCount >= 4) return { success: false, error: "部屋は満員です" };
        if (roomData.status !== 'waiting') return { success: false, error: "ゲームは既に始まっています" };

        const usedIndices = Object.values(players).map(p => p.index);
        for (let i = 0; i < 4; i++) {
          if (!usedIndices.includes(i)) {
            myIndex = i;
            break;
          }
        }
      }

      const newPlayer = {
        name: playerName,
        id: this.playerId,
        index: myIndex,
        isHost: false,
        isReady: true
      };

      await update(ref(this.db, `games/${code}/players/${this.playerId}`), newPlayer);
      onDisconnect(ref(this.db, `games/${code}/players/${this.playerId}`)).remove();

      this.listenToRoom();
      return { success: true, index: myIndex };

    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  }

  listenToRoom() {
    if (!this.currentRoomId) return;

    const roomRef = ref(this.db, 'games/' + this.currentRoomId);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // 安全のためホストIDが変更されれば更新
        if (data.hostId) this.hostId = data.hostId;

        if (this.onRoomUpdate) this.onRoomUpdate(data);

        if (data.status === 'playing' && this.onGameStart) {
          if (!this.gameStarted) {
            this.gameStarted = true;
            this.onGameStart();
          }
        }
      } else {
        if (this.onRoomUpdate) this.onRoomUpdate(null);
      }
    });
  }

  async startGame() {
    if (!this.isHost || !this.currentRoomId) return;

    const roomRef = ref(this.db, 'games/' + this.currentRoomId);
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
          isCpu: true
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(roomRef, updates);
    }

    await remove(ref(this.db, `games/${this.currentRoomId}/actions`));
    await update(roomRef, { status: 'playing' });
  }

  async resetRoom() {
    if (!this.isHost || !this.currentRoomId) return;

    const updates = {};
    updates[`games/${this.currentRoomId}/status`] = 'waiting';
    updates[`games/${this.currentRoomId}/gameState`] = null;
    updates[`games/${this.currentRoomId}/actions`] = null;

    const snapshot = await get(ref(this.db, `games/${this.currentRoomId}/players`));
    const players = snapshot.val() || {};
    Object.keys(players).forEach(key => {
      updates[`games/${this.currentRoomId}/players/${key}/isReadyForNextRound`] = false;
    });

    await update(ref(this.db), updates);
  }

  // === ゲーム同期 ===

  async setInitialState(state) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `games/${this.currentRoomId}/gameState`), state);
  }

  // ルートのturn更新（権限処理に重要）
  async updateTurn(nextPlayerUid) {
    if (!this.currentRoomId) return;
    console.log("Syncing Turn to UID:", nextPlayerUid);
    // 自身のUIDがturnと一致する場合のみ書き込み可能
    await update(ref(this.db, `games/${this.currentRoomId}`), {
      turn: nextPlayerUid
    });
  }

  subscribeToInitialState(callback) {
    if (!this.currentRoomId) return;
    const stateRef = ref(this.db, `games/${this.currentRoomId}/gameState`);
    onValue(stateRef, (snapshot) => {
      const state = snapshot.val();
      if (state) callback(state);
    });
  }

  async sendGameAction(action) {
    if (!this.currentRoomId) return;
    const actionRef = push(ref(this.db, `games/${this.currentRoomId}/actions`));
    await set(actionRef, {
      ...action,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  async getGameState() {
    if (!this.currentRoomId) return null;
    const snapshot = await get(ref(this.db, `games/${this.currentRoomId}/gameState`));
    return snapshot.val();
  }

  async getGameActions() {
    if (!this.currentRoomId) return [];
    const snapshot = await get(ref(this.db, `games/${this.currentRoomId}/actions`));
    const actions = snapshot.val();
    if (!actions) return [];
    return Object.values(actions);
  }

  subscribeToGameActions(callback) {
    if (!this.currentRoomId) return;
    const actionsRef = ref(this.db, `games/${this.currentRoomId}/actions`);

    onChildAdded(actionsRef, (snapshot) => {
      const action = snapshot.val();
      if (action) callback(action);
    });
  }

  // === 特殊イベント (五しなど) ===

  async sendSpecialWin(condition) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `games/${this.currentRoomId}/specialWin`), condition);
  }

  async sendFiveShiEvent(condition) {
    if (!this.currentRoomId) return;
    await set(ref(this.db, `games/${this.currentRoomId}/fiveShi`), condition);
  }

  async sendRedeal() {
    if (!this.currentRoomId) return;
    const updates = {};
    updates[`games/${this.currentRoomId}/fiveShi`] = null;
    updates[`games/${this.currentRoomId}/redeal`] = Date.now();
    await update(ref(this.db), updates);
  }

  subscribeToSpecialEvents(callbacks) {
    if (!this.currentRoomId) return;
    const roomRef = ref(this.db, `games/${this.currentRoomId}`);

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

  // === ラウンド同期 ===

  async setReadyForNextRound(roundNumber) {
    if (!this.currentRoomId) return;
    await update(ref(this.db, `games/${this.currentRoomId}/players/${this.playerId}`), {
      readyForRound: roundNumber
    });
  }

  waitForAllPlayersReady(targetRound) {
    return new Promise((resolve) => {
      const playersRef = ref(this.db, `games/${this.currentRoomId}/players`);
      let unsubscribe;
      let resolved = false;

      unsubscribe = onValue(playersRef, (snapshot) => {
        const players = snapshot.val() || {};
        const allReady = Object.values(players).every(p => {
          if (p.isCpu) return true;
          // 特定のターゲットラウンド以上で準備完了か確認
          return (p.readyForRound && p.readyForRound >= targetRound);
        });

        if (allReady) {
          if (unsubscribe) unsubscribe();
          resolved = true;
          resolve();
        }
      });

      if (resolved && unsubscribe) unsubscribe();
    });
  }

  // モーダル閉鎖通知 (手番権限不要)
  async setModalClosed() {
    if (!this.currentRoomId) return;
    const { set, ref } = await import("firebase/database");
    // 手番権限が不要な別のノードを使用
    await set(ref(this.db, `games/${this.currentRoomId}/modalStatus/${this.playerId}`), {
      closed: true,
      timestamp: Date.now()
    });
  }

  // ホスト: 全員のモーダル閉鎖待機
  async waitForAllModalsClosed() {
    const { get, ref, onValue } = await import("firebase/database");

    return new Promise(async (resolve) => {
      const modalRef = ref(this.db, `games/${this.currentRoomId}/modalStatus`);
      let unsubscribe;

      unsubscribe = onValue(modalRef, async (snapshot) => {
        const modalStatuses = snapshot.val() || {};

        // 現在のプレイヤーを取得
        const playersSnap = await get(ref(this.db, `games/${this.currentRoomId}/players`));
        const players = playersSnap.val() || {};

        // CPU以外の全プレイヤーが閉じたか確認
        const allClosed = Object.values(players).every(p => {
          if (p.isCpu) return true;
          return modalStatuses[p.id] && modalStatuses[p.id].closed;
        });

        if (allClosed) {
          if (unsubscribe) unsubscribe();
          // 次のラウンド用にステータスをクリア
          const { set } = await import("firebase/database");
          await set(ref(this.db, `games/${this.currentRoomId}/modalStatus`), null);
          resolve();
        }
      });
    });
  }
}
