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
    this.visibleKingCount = 0;

    this.isNetworkGame = false;
    this.localPlayerIndex = -1; // Default -1 (Invalid) until identified
    this.isSubscribedToActions = false;
    this.initialStateSubscribed = false; // Track if we already subscribed to InitialState

    // Network Callbacks
    if (this.network) {
      this.network.onGameStart = () => this.startNetworkGame();
      // Listen for actions - MOVED to startNetworkGame
    }
  }

  // Helper to sync turn UID to Firebase (Critical for Write Permissions)
  async syncTurnToNetwork() {
    if (!this.isNetworkGame || !this.network.currentRoomId) return;

    // Find UID of the NEW turn player
    const p = this.players[this.turnPlayerIndex];
    // If Human, use their ID. If CPU, use Host ID (because Host plays/writes for CPU).
    // If Human, use their stored Firebase UID. If CPU, use Host ID.
    let targetUid = p.uid;
    if (!p.isHuman) {
      // CPU: The Host controls them, so Host needs write permission.
      targetUid = this.network.hostId;
    }

    if (targetUid) {
      await this.network.updateTurn(targetUid);
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
    this.isNetworkGame = true; // Set network flag
    const { get, ref } = await import("firebase/database");
    const snapshot = await get(ref(this.network.db, `games/${this.network.currentRoomId}`));
    const roomData = snapshot.val();

    // Setup Game UI first
    this.renderer.setupGameUI();

    // === RECONNECTION LOGIC ===
    if (roomData.status === 'playing') {
      this.renderer.log("進行中のゲームに再接続しています...");
      const gameState = await this.network.getGameState();
      const actions = await this.network.getGameActions();

      if (gameState) {
        await this.restoreState(gameState, actions);
        return;
      }
    }

    // === NEW GAME LOGIC ===
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

      // Subscribe to game actions (for remote players and guests)
      if (!this.isSubscribedToActions) {
        this.network.subscribeToGameActions((action) => this.handleRemoteAction(action));
        this.isSubscribedToActions = true;
      }

      // Initial Turn Sync (Host Logic)
      this.syncTurnToNetwork();
      this.nextTurn();
    } else {
      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ゲスト) ===`);
      this.renderer.log(`ホストの準備を待っています...`);

      // Wait for Initial State (ONLY ONCE - Reused for all rounds)
      if (!this.initialStateSubscribed) {
        this.network.subscribeToInitialState((state) => {
          // This callback will fire for EVERY round (round 1, 2, 3...)
          if (state.round < this.roundCount) {
            // Ignore old state
            console.log(`Ignoring old round state: ${state.round} (Current: ${this.roundCount})`);
            return;
          }

          // Update local round count to match network (Sync up)
          this.roundCount = state.round;

          // Setup Players from Host's State (only needed for first round)
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

          // Subscribe to game actions (for remote players including host)
          if (!this.isSubscribedToActions) {
            this.network.subscribeToGameActions((action) => this.handleRemoteAction(action));
            this.isSubscribedToActions = true;
          }

          this.nextTurn();
        });
        this.initialStateSubscribed = true;
      }
    }
  }

  async restoreState(state, actions) {
    // 1. Setup Players
    if (state.players) this.setupPlayersFromNetwork(state.players);

    // 2. Set Hands & Turn
    this.players.forEach((p, i) => {
      const handData = state.hands[i];
      p.setHand(handData.map(d => new Card(d.type, d.id)));
    });
    this.turnPlayerIndex = state.turn;
    this.roundCount = state.round;

    this.renderer.log(`状態復元: ラウンド ${this.roundCount}, 手番 P${this.turnPlayerIndex}`);

    // 3. Replay Actions
    if (actions && actions.length > 0) {
      this.renderer.log(`過去のアクションをリプレイ中 (${actions.length}件)...`);
      for (const action of actions) {
        // We use executeActionLogic directly to avoid sending to network again
        // But we need to reconstruct Card objects
        const player = this.players[action.playerIndex];
        if (action.card1) {
          const c = new Card(action.card1.type, action.card1.id);
          c.isJewel = action.card1.isJewel;
          action.card1 = c;
        }
        if (action.card2) {
          const c = new Card(action.card2.type, action.card2.id);
          c.isJewel = action.card2.isJewel;
          action.card2 = c;
        }

        await this.executeActionLogic(player, action);
      }
    }

    this.renderer.render(this);
    this.nextTurn();
  }

  setupPlayersFromNetwork(playersData) {
    console.log("Setting up players from network...", playersData);
    Object.values(playersData).forEach(pData => {
      const index = pData.index;
      const p = this.players[index];
      p.isHuman = !pData.isCpu; // Set Human/CPU flag
      p.name = pData.name; // Store name
      p.uid = pData.id; // STORE FIREBASE UID for permission checks

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
    this.visibleKingCount = 0;

    // Reset hand reveal flags for all players
    this.players.forEach(p => p.revealHand = false);

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

      // Prevent stale round check from blocking
      if (this.network.isHost) {
        // Host increments immediately to prepare next state
        this.roundCount++;
      } else {
        // Guest: Do NOT increment roundCount locally. Wait for Network to tell us.
      }

      try {
        // 1. Set Ready for the NEXT round
        let targetRound;
        if (this.network.isHost) {
          targetRound = this.roundCount; // Host already incremented
        } else {
          targetRound = this.roundCount + 1; // Guest still at old round
        }

        console.log(`Setting Ready for Round ${targetRound}`);
        await this.network.setReadyForNextRound(targetRound);

        if (this.network.isHost) {
          this.renderer.log("全員の準備完了を待っています...");
          // 2. Wait for everyone to be ready for targetRound
          await this.network.waitForAllPlayersReady(targetRound);

          // Host: Start New Round
          this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (ホスト) ===`);

          // Create new deck and deal
          this.initDeck();
          this.deal();

          // Serialize Hands for network
          const handsData = this.players.map(p => p.hand.map(c => ({ type: c.type, id: c.id })));

          // Send New Round State to Guests
          this.network.setInitialState({
            hands: handsData,
            turn: this.turnPlayerIndex,
            round: this.roundCount,
            players: null
          });

          // Sync Turn UID for new round
          this.syncTurnToNetwork();

          this.renderer.render(this);
          this.nextTurn();
        } else {
          this.renderer.log("ホストの開始を待っています...");
        }
      } catch (e) {
        console.error("Next Round Error:", e);
        this.renderer.log(`エラー: ${e.message}`);
      }
    }
  }

  initDeck() {
    this.deck = [];
    let idCounter = 0;
    for (const [type, count] of Object.entries(INITIAL_DECK_COUNTS)) {
      for (let i = 0; i < count; i++) {
        const card = new Card(type, idCounter++);
        // If King and it's the second one (odd index or just track it), make it Jewel
        if (type === CARD_TYPES.KING) {
          // We have 2 Kings. Let's say the one with higher ID is Jewel, or just the second one created.
          // Since we push sequentially, we can check if we already have a King in deck?
          // Or simpler: The loop runs twice.
          if (i === 1) card.isJewel = true;
        }
        this.deck.push(card);
      }
    }
    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  deal() {
    const handSize = 8;
    for (let i = 0; i < 4; i++) {
      const hand = this.deck.splice(0, handSize);
      this.players[i].setHand(hand);
    }
    this.checkHandConditions();
  }

  checkHandConditions() {
    // Only Host checks conditions in Network Game (and syncs result)
    // Or Single Player checks locally.
    if (this.isNetworkGame && !this.network.isHost) return;

    let shiCounts = {};
    let conditions = [];

    this.players.forEach(p => {
      const shiCount = p.hand.filter(c => c.type === CARD_TYPES.pawn).length;
      shiCounts[p.id] = shiCount;

      if (shiCount === 8) {
        conditions.push({ type: '8shi', playerId: p.id, score: 100 });
      } else if (shiCount === 7) {
        const other = p.hand.find(c => c.type !== CARD_TYPES.pawn);
        const score = (SCORES[other.type] || 10) * 2;
        conditions.push({ type: '7shi', playerId: p.id, score: score });
      } else if (shiCount === 6) {
        const others = p.hand.filter(c => c.type !== CARD_TYPES.pawn);
        let score = 0;
        if (others[0].type === others[1].type) {
          score = (SCORES[others[0].type] || 10) * 2;
        } else {
          score = Math.max(SCORES[others[0].type] || 0, SCORES[others[1].type] || 0);
        }
        conditions.push({ type: '6shi', playerId: p.id, score: score });
      } else if (shiCount === 5) {
        conditions.push({ type: '5shi', playerId: p.id });
      }
    });

    // Check Team 5 Shi (Player 0&2 or 1&3)
    if (shiCounts[0] === 5 && shiCounts[2] === 5) {
      conditions.push({ type: 'team5shi', team: 0, score: 150 });
    }
    if (shiCounts[1] === 5 && shiCounts[3] === 5) {
      conditions.push({ type: 'team5shi', team: 1, score: 150 });
    }

    // Prioritize: Team 5 Shi > 8 Shi > 7 Shi > 6 Shi > 5 Shi
    const winCondition = conditions.find(c => ['team5shi', '8shi', '7shi', '6shi'].includes(c.type));
    if (winCondition) {
      this.handleSpecialWin(winCondition);
      return;
    }

    // Handle 5 Shi cases
    const fiveShiList = conditions.filter(c => c.type === '5shi');
    if (fiveShiList.length > 0) {
      this.handleFiveShiScenarios(fiveShiList);
    }
  }

  handleSpecialWin(condition) {
    this.renderer.log(`特殊勝利条件: ${condition.type}`);

    // Reveal the hand of the player(s) who triggered the special win
    if (condition.playerId !== undefined) {
      const player = this.players[condition.playerId];
      player.revealHand = true; // Mark this player's hand as revealed
      this.renderer.render(this); // Update UI to show the hand
    } else if (condition.type === 'team5shi') {
      // For team 5 shi, reveal both players' hands
      const team = condition.team;
      this.players[team].revealHand = true;
      this.players[team + 2].revealHand = true;
      this.renderer.render(this);
    }

    // Delay to let UI render
    setTimeout(() => {
      let winnerId = condition.playerId;
      if (condition.type === 'team5shi') winnerId = condition.team; // Team index

      // Update Score
      this.teamScores[winnerId % 2] += condition.score;
      this.renderer.updateScores(this.teamScores);

      // Show Result (pass condition for hand reveal info)
      this.gameOver = true; // Round Over actually
      this.renderer.showRoundResult(winnerId, condition.score, this.teamScores.some(s => s >= 150), condition);

      if (this.isNetworkGame) {
        this.network.sendSpecialWin(condition);
      }
    }, 1000);
  }

  handleFiveShiScenarios(fiveShiList) {
    const playerIds = fiveShiList.map(c => c.playerId);
    this.renderer.log(`五し: プレイヤー ${playerIds.join(', ')}`);

    // Check Team 5 Shi (both partners): Already handled above
    // Check Enemy/Ally 5 Shi (one from each team)
    const team0Count = playerIds.filter(id => id % 2 === 0).length;
    const team1Count = playerIds.filter(id => id % 2 === 1).length;

    if (team0Count > 0 && team1Count > 0) {
      // Enemy/Ally 5 Shi: Both partners must choose redeal
      this.handleEnemyAllyFiveShi(fiveShiList);
    } else {
      // Single 5 Shi: Partner decides
      this.handleSingleFiveShi(fiveShiList[0]);
    }
  }

  handleSingleFiveShi(condition) {
    const playerId = condition.playerId;
    const partnerId = (playerId + 2) % 4;
    this.renderer.log(`プレイヤー ${playerId} が「五し」。相方(P${partnerId})が判断します。`);

    if (!this.isNetworkGame) {
      // In Single Player: Ask the partner
      if (partnerId === 0) {
        // Human partner
        this.renderer.showFiveShiDialog(
          () => this.redeal(),
          () => this.renderer.log("続行します。")
        );
      } else {
        // CPU partner: Auto decide (for now, auto redeal)
        this.renderer.log(`CPU (P${partnerId}) が配り直しを選択しました。`);
        setTimeout(() => this.redeal(), 1000);
      }
    } else {
      // Network: Send Event with partnerId
      this.network.sendFiveShiEvent({ ...condition, partnerId });
    }
  }

  handleEnemyAllyFiveShi(fiveShiList) {
    this.renderer.log("敵・味方それぞれ一人が「五し」です。両相方が配り直しを選択した場合のみ配り直します。");

    // Store pending decisions
    this.pendingFiveShiDecisions = {
      players: fiveShiList.map(c => c.playerId),
      decisions: {} // partnerId -> true/false
    };

    // Ask each partner
    fiveShiList.forEach(condition => {
      const playerId = condition.playerId;
      const partnerId = (playerId + 2) % 4;

      if (!this.isNetworkGame) {
        if (partnerId === 0) {
          // Human partner
          this.renderer.showFiveShiDialog(
            () => this.recordFiveShiDecision(partnerId, true),
            () => this.recordFiveShiDecision(partnerId, false)
          );
        } else {
          // CPU partner: Auto decide
          setTimeout(() => this.recordFiveShiDecision(partnerId, true), 1000);
        }
      } else {
        // Network: Send Event
        this.network.sendFiveShiEvent({ ...condition, partnerId, isEnemyAllyScenario: true });
      }
    });
  }

  recordFiveShiDecision(partnerId, wantsRedeal) {
    if (!this.pendingFiveShiDecisions) return;

    this.pendingFiveShiDecisions.decisions[partnerId] = wantsRedeal;
    this.renderer.log(`P${partnerId} が ${wantsRedeal ? '配り直し' : '続行'} を選択。`);

    // Check if all decisions are in
    const allDecided = this.pendingFiveShiDecisions.players.every(pId => {
      const partnerId = (pId + 2) % 4;
      return this.pendingFiveShiDecisions.decisions[partnerId] !== undefined;
    });

    if (allDecided) {
      // Both partners must choose redeal
      const allRedeal = Object.values(this.pendingFiveShiDecisions.decisions).every(d => d === true);
      this.pendingFiveShiDecisions = null;

      if (allRedeal) {
        this.renderer.log("両相方が配り直しを選択しました。配り直します。");
        setTimeout(() => this.redeal(), 1000);
      } else {
        this.renderer.log("片方が続行を選択しました。ゲームを続行します。");
        this.nextTurn();
      }
    }
  }

  redeal() {
    this.renderer.log("配り直し...");
    this.renderer.clearField();
    this.initDeck();
    this.deal();
    this.renderer.render(this);
    this.nextTurn();
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
      if (cleanAction.card1) cleanAction.card1 = { type: cleanAction.card1.type, id: cleanAction.card1.id, isJewel: cleanAction.card1.isJewel };
      if (cleanAction.card2) cleanAction.card2 = { type: cleanAction.card2.type, id: cleanAction.card2.id, isJewel: cleanAction.card2.isJewel };

      this.renderer.logNetwork(`Sending Action: P${player.id} ${action.action}`);
      await this.network.sendGameAction(cleanAction);

      // 3. Sync Turn if Changed
      // If I played, I am responsible for passing the turn (updating the 'turn' UID)
      // Note: executeActionLogic updated 'this.turnPlayerIndex' already.
      // logic: I had write permission (my turn), I wrote action. Now I write turn update.
      await this.syncTurnToNetwork();
    }

    // Resume Turn Loop (After Action + Network Sync)
    this.nextTurn();

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
    // Reconstruct Cards
    if (remoteAction.card1) {
      const c = new Card(remoteAction.card1.type, remoteAction.card1.id);
      c.isJewel = remoteAction.card1.isJewel;
      remoteAction.card1 = c;
    }
    if (remoteAction.card2) {
      const c = new Card(remoteAction.card2.type, remoteAction.card2.id);
      c.isJewel = remoteAction.card2.isJewel;
      remoteAction.card2 = c;
    }

    this.renderer.log(`Remote Action from P${player.id}`);
    await this.executeActionLogic(player, remoteAction);

    // Resume Turn Loop (After Remote Action)
    this.nextTurn();
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
        // trick finished, turnPlayerIndex updated inside finishTrick
      } else {
        this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
        // nextTurn() removed - called by caller
      }
      return { valid: true };
    }

    if (action.action === 'playTurn') {
      const { card1, card2 } = action;
      if (!card1 || !card2) return { valid: false, reason: "カードを2枚選んでください" };

      // === KING RULE CHECK ===
      // If attacking with King, must have at least 2 Kings in hand (including the ones being played)
      if (card2.type === CARD_TYPES.KING) {
        const kingInHand = player.hand.filter(c => c.type === CARD_TYPES.KING).length;
        // Logic: King in hand (which includes the ones we are about to play) + Visible Kings on board must be >= 2
        // Note: card1 and card2 are still in 'hand' at this point.
        if ((kingInHand + this.visibleKingCount) < 2) {
          return { valid: false, reason: "王(玉)で攻めるには、もう一枚の王(玉)が必要です (手札または場)" };
        }
      }

      // Check validity based on State
      if (!this.currentAttack) {
        // === LEAD ===
        player.removeCard(card1);
        player.removeCard(card2);

        const cardName = card2.isJewel ? "玉" : card2.type;
        this.renderer.log(`プレイヤー ${player.id} 攻め: [伏せ] -> ${cardName}`);
        this.renderer.showPlay(player.id, card1, card2, true);

        if (card2.type === CARD_TYPES.KING) this.visibleKingCount++;

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const isDouble = (card1.type === card2.type);
        if (isDouble) {
          this.renderer.revealLastLead(player.id, card1);
        }

        const roundEnded = await this.checkWin(player, isDouble);

        if (!this.gameOver && !roundEnded) {
          this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
          // nextTurn() removed - called by caller
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

        const c1Name = card1.isJewel ? "玉" : card1.type;
        const c2Name = card2.isJewel ? "玉" : card2.type;
        this.renderer.log(`プレイヤー ${player.id} 受け・攻め: ${c1Name} -> ${c2Name}`);
        this.renderer.showPlay(player.id, card1, card2, false);

        if (card1.type === CARD_TYPES.KING) this.visibleKingCount++;
        if (card2.type === CARD_TYPES.KING) this.visibleKingCount++;

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const isDouble = (card1.type === card2.type);

        // Reveal the receive card if it's a double
        if (isDouble) {
          // For counter, card1 is already visible (not hidden), but we highlight it
          this.renderer.revealLastReceive(player.id, card1);
        }

        const roundEnded = await this.checkWin(player, isDouble);

        if (!this.gameOver && !roundEnded) {
          this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
          // nextTurn() removed - called by caller
        }
        return { valid: true };
      }
    }
  }

  finishTrick(winnerIndex) {
    this.currentAttack = null;
    this.passCount = 0;
    this.turnPlayerIndex = winnerIndex;
    this.renderer.render(this);
    // nextTurn() removed - called by caller
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
