import { CARD_TYPES, INITIAL_DECK_COUNTS, PLAYERS } from './constants.js';
import { Card } from './Card.js';
import { Player } from './Player.js';

export class GoitaBoard {
  constructor(renderer) {
    this.renderer = renderer;
    this.network = renderer.network; // Access NetworkManager
    this.players = PLAYERS.map(id => new Player(id, id === 0)); // Default: Player 0 is Human
    this.deck = [];
    this.turnPlayerIndex = 0;
    this.currentAttack = null;
    this.passCount = 0;
    this.gameOver = false;
    this.teamScores = [0, 0];
    this.roundCount = 1;

    this.isNetworkGame = false;
    this.localPlayerIndex = -1; // Default -1 (Invalid) until identified
    this.isSubscribedToActions = false;

    // Network Callbacks
    if (this.network) {
      this.network.onGameStart = () => this.startNetworkGame();
      // Listen for actions - MOVED to startNetworkGame
    }
  }

  // === Single Player Start ===
  start() {
    this.isNetworkGame = false;
    this.initDeck();
    this.deal();
    this.renderer.render(this);
    this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (シングル) ===`);
    this.nextTurn();
  }

  // === Network Game Start ===
  async startNetworkGame() {
    this.isNetworkGame = true;

    // Subscribe to Actions if not already
    if (!this.isSubscribedToActions) {
      this.renderer.logNetwork(`Subscribing to Actions for Room: ${this.network.currentRoomId}`);
      this.network.subscribeToGameActions((action) => this.handleRemoteAction(action));
      this.isSubscribedToActions = true;
    }

    this.renderer.setupGameUI(); // Switch to Game View

    if (this.network.isHost) {
      const playersData = roomData.players;

      // Setup Local Players
      this.setupPlayersFromNetwork(playersData);

      this.initDeck();
      this.deal();

      // Serialize Hands
      const handsData = this.players.map(p => p.hand.map(c => ({ type: c.type, id: c.id })));

      // Send Initial State
      this.network.setInitialState({
        hands: handsData,
        turn: 0,
        round: this.roundCount,
        players: playersData // Send player info to guests
      });

      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ホスト) ===`);
      this.renderer.render(this); // Update UI for Host
      this.nextTurn();
    } else {
      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ゲスト) ===`);
      this.renderer.log(`ホストの準備を待っています...`);

      // Wait for Initial State
      this.network.subscribeToInitialState((state) => {
        if (state.round !== this.roundCount) return;

        // Setup Players from Host's State
        if (state.players) {
          this.setupPlayersFromNetwork(state.players);
        }

        // Apply State
        this.players.forEach((p, i) => {
          const handData = state.hands[i];
          p.setHand(handData.map(d => new Card(d.type, d.id)));
        });
        this.turnPlayerIndex = state.turn;

        this.renderer.render(this);
        this.nextTurn();
      });
    }
  }

  setupPlayersFromNetwork(playersData) {
    console.log("Setting up players from network...", playersData);
    Object.values(playersData).forEach(pData => {
      const index = pData.index;
      const p = this.players[index];
      p.isHuman = !pData.isCpu; // Set Human/CPU flag
      p.name = pData.name; // Store name

      // Update Renderer Names
      if (this.renderer.playerNames) {
        this.renderer.playerNames[index] = pData.name;
      }

      // Identify Myself
      if (pData.id === this.network.playerId) {
        console.log(`Identified myself as Player ${index}`);
        this.renderer.log(`ID一致: プレイヤー ${index} として参加`);
        this.localPlayerIndex = index;
        p.isHuman = true; // I am human
      }
    });

    // If I am Host, I am definitely Player 0 (usually)
    if (this.network.isHost) {
      this.localPlayerIndex = 0;
      console.log("I am Host (Player 0)");
    }

    if (this.localPlayerIndex === -1) {
      this.renderer.log("エラー: プレイヤーIDが見つかりません (観戦モード)");
    }

    this.renderer.setLocalPlayer(this.localPlayerIndex);
    this.renderer.updateNameTags();
  }

  async nextRound(winnerId) {
    this.roundCount++;
    this.gameOver = false;
    this.turnPlayerIndex = winnerId;
    this.currentAttack = null;
    this.passCount = 0;

    this.renderer.clearField();

    if (!this.isNetworkGame) {
      this.initDeck();
      this.deal();
      this.renderer.render(this);
      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 ===`);
      this.nextTurn();
    } else {
      // Network Round Reset
      this.renderer.log("次のラウンドの準備中...");

      // 1. Set Ready
      await this.network.setReadyForNextRound(true);

      if (this.network.isHost) {
        this.renderer.log("全員の準備完了を待っています...");
        // 2. Wait for everyone
        await this.network.waitForAllPlayersReady();

        // 3. Reset Ready Flags
        await this.network.resetAllPlayersReady();

        // 4. Start New Round
        this.startNetworkGame();
      } else {
        this.renderer.log("ホストの開始を待っています...");
        // Guest just waits for startNetworkGame triggered by InitialState update
      }
    }
  }

  initDeck() {
    this.deck = [];
    let idCounter = 0;
    for (const [type, count] of Object.entries(INITIAL_DECK_COUNTS)) {
      for (let i = 0; i < count; i++) {
        this.deck.push(new Card(type, idCounter++));
      }
    }
    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  deal() {
    this.players.forEach(p => {
      p.setHand(this.deck.splice(0, 8));
    });
  }

  async nextTurn() {
    if (this.gameOver) return;

    const player = this.players[this.turnPlayerIndex];
    this.renderer.highlightPlayer(this.turnPlayerIndex);

    // Network Logic
    if (this.isNetworkGame) {
      const amIHost = this.network.isHost;
      const isMyTurn = (this.turnPlayerIndex === this.localPlayerIndex);

      // Check if current player is NPC (controlled by Host)
      // We rely on isHuman flag set in setupPlayersFromNetwork
      // Note: In Network Mode, isHuman means "Real Human".
      // So !isHuman means NPC.

      const isNpc = !player.isHuman;

      if (amIHost && isNpc) {
        // Host controls NPC -> Proceed to AI logic
      } else if (!isMyTurn) {
        return; // Wait for remote
      }
    }

    // Get action (Human input or AI)
    const action = await player.decideAction({
      currentAttack: this.currentAttack,
      history: []
    });

    if (!action && player.isHuman) {
      this.renderer.enableControls(true, this.currentAttack);
      return;
    }

    if (action) {
      this.processAction(player, action);
    }
  }

  // Human Input Handler called by Renderer
  async handleHumanAction(action) {
    const player = this.players[this.turnPlayerIndex]; // Should be me
    // Validation
    if (this.isNetworkGame && this.turnPlayerIndex !== this.localPlayerIndex) return;

    const result = await this.processAction(player, action);
    if (!result.valid) {
      alert(result.reason);
      return; // Retry
    }
    this.renderer.enableControls(false);
  }

  async processAction(player, action) {
    // 1. Validate & Execute Locally
    const result = await this.executeActionLogic(player, action);

    if (this.isNetworkGame) {
      // 2. Send to Network
      const cleanAction = { ...action, playerIndex: player.id };
      if (cleanAction.card1) cleanAction.card1 = { type: cleanAction.card1.type, id: cleanAction.card1.id };
      if (cleanAction.card2) cleanAction.card2 = { type: cleanAction.card2.type, id: cleanAction.card2.id };

      this.renderer.logNetwork(`Sending Action: P${player.id} ${action.action}`);
      this.network.sendGameAction(cleanAction);
    }
    return result;
  }

  async handleRemoteAction(remoteAction) {
    this.renderer.logNetwork(`Received Action: P${remoteAction.playerIndex} ${remoteAction.action}`);
    // console.log("Received Remote Action:", remoteAction);

    if (remoteAction.playerIndex === this.localPlayerIndex) {
      this.renderer.logNetwork(`IGNORED (Self Index: ${this.localPlayerIndex})`);
      return;
    }
    if (remoteAction.playerId === this.network.playerId) {
      this.renderer.logNetwork(`IGNORED (Self ID)`);
      return;
    }

    const player = this.players[remoteAction.playerIndex];

    // Reconstruct Cards
    if (remoteAction.card1) remoteAction.card1 = new Card(remoteAction.card1.type, remoteAction.card1.id);
    if (remoteAction.card2) remoteAction.card2 = new Card(remoteAction.card2.type, remoteAction.card2.id);

    this.renderer.log(`Remote Action from P${player.id}`);
    await this.executeActionLogic(player, remoteAction);
  }

  // Separated Logic for reuse
  async executeActionLogic(player, action) {
    if (action.action === 'pass') {
      if (!this.currentAttack) {
        return { valid: false, reason: "攻めの手番ではパスできません" };
      }
      this.passCount++;
      this.renderer.log(`プレイヤー ${player.id}: なし`);

      if (this.passCount >= 3) {
        const winnerIndex = this.currentAttack.playerIndex;
        this.finishTrick(winnerIndex);
      } else {
        this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
        this.nextTurn();
      }
      return { valid: true };
    }

    if (action.action === 'playTurn') {
      const { card1, card2 } = action;
      if (!card1 || !card2) return { valid: false, reason: "カードを2枚選んでください" };

      // Check validity based on State
      if (!this.currentAttack) {
        // === LEAD ===
        player.removeCard(card1);
        player.removeCard(card2);

        this.renderer.log(`プレイヤー ${player.id} 攻め: [伏せ] -> ${card2.type}`);
        this.renderer.showPlay(player.id, card1, card2, true);

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const roundEnded = await this.checkWin(player);

        if (!this.gameOver && !roundEnded) {
          this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
          this.nextTurn();
        }
        return { valid: true };

      } else {
        // === COUNTER ===
        const attackType = this.currentAttack.card.type;
        const defType = card1.type;

        let validDef = (attackType === defType);
        // King Rule
        if (!validDef && defType === CARD_TYPES.KING) {
          if (attackType !== CARD_TYPES.pawn && attackType !== CARD_TYPES.lance) {
            validDef = true;
          }
        }

        if (!validDef) return { valid: false, reason: "そのカードでは受けられません" };

        player.removeCard(card1);
        player.removeCard(card2);

        this.renderer.log(`プレイヤー ${player.id} 受け・攻め: ${card1.type} -> ${card2.type}`);
        this.renderer.showPlay(player.id, card1, card2, false);

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const isDouble = (card1.type === card2.type);

        const roundEnded = await this.checkWin(player, isDouble);

        if (!this.gameOver && !roundEnded) {
          this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
          this.nextTurn();
        }
        return { valid: true };
      }
    }
  }

  finishTrick(winnerIndex) {
    this.renderer.log(`全員パス。プレイヤー ${winnerIndex} が再攻撃します。`);
    this.currentAttack = null;
    this.passCount = 0;
    this.turnPlayerIndex = winnerIndex;
    this.renderer.render(this);
    this.nextTurn();
  }

  async checkWin(player, isDouble = false) {
    if (player.hand.length === 0) {
      let score = 30;
      if (this.currentAttack && this.currentAttack.playerIndex === player.id) {
        const SCORES = { '王': 50, '飛': 40, '角': 40, '金': 30, '銀': 30, '馬': 20, '香': 20, 'し': 10 };
        score = SCORES[this.currentAttack.card.type] || 30;
      }

      if (isDouble) {
        score *= 2;
        this.renderer.log(`ダブル得点！ (同種受け攻め)`);
      }

      this.teamScores[player.id % 2] += score;
      this.renderer.updateScores(this.teamScores);
      this.renderer.log(`ラウンド終了！ 勝者: プレイヤー ${player.id} (+${score})`);

      if (this.teamScores.some(s => s >= 150)) {
        this.gameOver = true;
        this.renderer.showRoundResult(player.id, score, true);
      } else {
        this.renderer.showRoundResult(player.id, score, false);
      }
      return true; // Round Ended
    }
    return false; // Round continues
  }
}
