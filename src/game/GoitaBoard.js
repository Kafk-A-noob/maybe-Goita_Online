import { CARD_TYPES, INITIAL_DECK_COUNTS, PLAYERS } from './constants.js';
import { Card } from './Card.js';
import { Player } from './Player.js';

export class GoitaBoard {
  constructor(renderer) {
    this.renderer = renderer;
    this.network = renderer.network; // NetworkManagerへのアクセス
    this.players = PLAYERS.map(id => new Player(id, id === 0)); // デフォルト: プレイヤー0が人間
    this.deck = [];
    this.turnPlayerIndex = 0;
    this.currentAttack = null;
    this.passCount = 0;
    this.gameOver = false;
    this.teamScores = [0, 0];
    this.roundCount = 1;
    this.visibleKingCount = 0;

    this.isNetworkGame = false;
    this.localPlayerIndex = -1; // デフォルト-1 (未特定)
    this.isSubscribedToActions = false;
    this.initialStateSubscribed = false; // 既に初期状態にサブスクライブしているか追跡

    // ネットワークコールバック
    if (this.network) {
      this.network.onGameStart = () => this.startNetworkGame();
      // アクションの監視は startNetworkGame に移動
    }
  }

  // 手番（turn）の書き込み権限を持つUIDをFirebaseに同期するヘルパー
  async syncTurnToNetwork() {
    if (!this.isNetworkGame || !this.network.currentRoomId) return;

    // 新しい手番プレイヤーの UID を取得
    const p = this.players[this.turnPlayerIndex];
    // 人間の場合はそのID（.uid）を使用。CPUの場合はホストIDを使用
    let targetUid = p.uid;
    if (!p.isHuman) {
      // CPU: ホストが制御するため、ホストに書き込み権限を与える
      targetUid = this.network.hostId;
    }

    if (targetUid) {
      await this.network.updateTurn(targetUid);
    }
  }


  // === シングルプレイ開始 ===
  start() {
    this.isNetworkGame = false;
    this.initDeck();
    this.deal();
    this.renderer.render(this);
    this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (シングル) ===`);
    // deal() -> checkHandConditions() calls nextTurn() or handles conditions
  }

  // === ネットワークゲーム開始 ===
  async startNetworkGame() {
    this.isNetworkGame = true; // ネットワークフラグを設定
    const { get, ref } = await import("firebase/database");
    const snapshot = await get(ref(this.network.db, `games/${this.network.currentRoomId}`));
    const roomData = snapshot.val();

    // ゲームUIの初期化
    this.renderer.setupGameUI();

    // === 再接続ロジック ===
    if (roomData.status === 'playing') {
      this.renderer.log("進行中のゲームに再接続しています...");
      const gameState = await this.network.getGameState();
      const actions = await this.network.getGameActions();

      if (gameState) {
        await this.restoreState(gameState, actions);
        return;
      }
    }

    // === 新規ゲームロジック ===
    if (this.network.isHost) {
      const playersData = roomData.players;

      // ローカルプレイヤーの設定
      this.setupPlayersFromNetwork(playersData);

      this.initDeck();
      this.deal();

      // 手札のシリアライズ
      const handsData = this.players.map(p => p.hand.map(c => ({ type: c.type, id: c.id })));

      // 初期状態の送信
      this.network.setInitialState({
        hands: handsData,
        turn: 0,
        round: this.roundCount,
        players: playersData // プレイヤー情報をゲストに送信
      });

      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ホスト) ===`);
      this.renderer.render(this); // ホストのUI更新

      // ゲームアクションの監視開始（リモートプレイヤーとゲスト用）
      if (!this.isSubscribedToActions) {
        this.network.subscribeToGameActions((action) => this.handleRemoteAction(action));
        this.isSubscribedToActions = true;
      }

      // 初回の手番同期（ホストロジック）
      this.syncTurnToNetwork();
      // deal() calls nextTurn() via checkHandConditions
    } else {
      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ゲスト) ===`);
      this.renderer.log(`ホストの準備を待っています...`);

      // 初期状態を待機（一度だけ - 全ラウンドで再利用）
      if (!this.initialStateSubscribed) {
        this.network.subscribeToInitialState((state) => {
          // このコールバックは毎ラウンド発火する
          if (state.round < this.roundCount) {
            // 古い状態なら無視
            console.log(`Ignoring old round state: ${state.round} (Current: ${this.roundCount})`);
            return;
          }

          // ローカルのラウンド数を同期
          this.roundCount = state.round;

          // モーダルを閉じる (ゲスト側でラウンド開始時に自動で閉じる)
          this.renderer.closeResultModal();

          // 状態のリセット (盤面クリアなど)
          this.resetLocalRoundState();

          // ホストの状態からプレイヤーを設定（初回のみ必要）
          if (state.players) {
            this.setupPlayersFromNetwork(state.players);
          }

          // 状態の適用
          this.players.forEach((p, i) => {
            const handData = state.hands[i];
            p.setHand(handData.map(d => new Card(d.type, d.id)));
          });
          this.turnPlayerIndex = state.turn;

          this.renderer.render(this);

          // ゲームアクションの監視開始（ホストを含む全リモートプレイヤー用）
          if (!this.isSubscribedToActions) {
            this.network.subscribeToGameActions((action) => this.handleRemoteAction(action));
            this.isSubscribedToActions = true;
          }

          this.nextTurn();
        });
        this.initialStateSubscribed = true;
      }
    }

    // Listener for Manual Five Shi (Host & Guest)
    // Avoid double subscription
    if (!this.fiveShiSubscribed) {
      this.network.subscribeToSpecialEvents({
        onSpecialWin: (cond) => this.handleSpecialWin(cond),
        onFiveShi: (cond) => { /* Legacy auto-handler, maybe unused now */ },
        onRedeal: () => this.redeal(),
        onFiveShiDeclaration: (data) => this.handleNetworkFiveShiDeclaration(data),
        onPartnerDecision: (data) => this.handleNetworkPartnerDecision(data)
      });
      this.fiveShiSubscribed = true;
    }
  }

  handleNetworkFiveShiDeclaration(data) {
    if (data.type === 'check') {
      if (data.playerId === this.localPlayerIndex) {
        setTimeout(() => {
          this.renderer.showFiveShiDialog(
            () => {
              this.network.sendFiveShiDeclaration({ type: 'result', playerId: this.localPlayerIndex, declared: true });
            },
            () => {
              this.network.sendFiveShiDeclaration({ type: 'result', playerId: this.localPlayerIndex, declared: false });
            }
          );
        }, 100);
      } else {
        this.renderer.log(`P${data.playerId} が五しの宣言を検討中...`);
      }
    } else if (data.type === 'result') {
      if (this.network.isHost) {
        this.handleFiveShiDeclaration(data.playerId, data.declared);
      } else {
        if (data.declared) this.renderer.log(`P${data.playerId} が五しを宣言しました！`);
        else this.renderer.log(`P${data.playerId} は宣言しませんでした。`);
      }
    }
  }

  handleNetworkPartnerDecision(data) {
    if (data.type === 'check') {
      if (data.partnerId === this.localPlayerIndex) {
        setTimeout(() => {
          this.renderer.showPartnerRedealDialog(
            data.declarerId,
            () => this.network.sendPartnerDecision({ type: 'result', partnerId: this.localPlayerIndex, redeal: true }),
            () => this.network.sendPartnerDecision({ type: 'result', partnerId: this.localPlayerIndex, redeal: false })
          );
        }, 100);
      } else {
        this.renderer.log(`P${data.partnerId} が配り直しを判断中...`);
      }
    } else if (data.type === 'result') {
      if (this.network.isHost) {
        this.handlePartnerDecision(data.partnerId, data.redeal);
      } else {
        const choice = data.redeal ? "配り直し" : "続行";
        this.renderer.log(`P${data.partnerId} は ${choice} を選択しました。`);
      }
    }
  }

  async restoreState(state, actions) {
    // 1. プレイヤーの設定
    if (state.players) this.setupPlayersFromNetwork(state.players);

    // 2. 手札と手番の設定
    this.players.forEach((p, i) => {
      const handData = state.hands[i];
      p.setHand(handData.map(d => new Card(d.type, d.id)));
    });
    this.turnPlayerIndex = state.turn;
    this.roundCount = state.round;

    this.renderer.log(`状態復元: ラウンド ${this.roundCount}, 手番 P${this.turnPlayerIndex}`);

    // 3. アクションのリプレイ
    if (actions && actions.length > 0) {
      this.renderer.log(`過去のアクションをリプレイ中 (${actions.length}件)...`);
      for (const action of actions) {
        // 再送信を避けるため executeActionLogic を直接使用
        // ただしカードオブジェクトの再構築が必要
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
      p.isHuman = !pData.isCpu; // 人間かどうかのフラグ
      p.name = pData.name; // 名前の保存
      p.uid = pData.id; // 権限チェック用にFirebase UIDを保存

      // レンダラーの名前更新
      if (this.renderer.playerNames) {
        this.renderer.playerNames[index] = pData.name;
      }

      // 自分自身の特定
      if (pData.id === this.network.playerId) {
        console.log(`Identified myself as Player ${index}`);
        this.renderer.log(`ID一致: プレイヤー ${index} として参加`);
        this.localPlayerIndex = index;
        p.isHuman = true; // 私は人間
        this.renderer.playerNames[index] = pData.name + " (あなた)";
      }
    });

    // ホストの場合、プレイヤー0であることが確定（通常）
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

  // ラウンド開始時のローカル状態リセット (ゲスト用)
  resetLocalRoundState() {
    this.currentAttack = null;
    this.passCount = 0;
    this.visibleKingCount = 0;
    this.gameOver = false;
    this.players.forEach(p => p.revealHand = false);
    this.renderer.clearField();
    this.renderer.closeResultModal(); // Ensure modal is closed
    this.renderer.log("ラウンド状態をリセットしました");
  }

  async nextRound(winnerId) {
    this.roundCount++;
    this.turnPlayerIndex = winnerId;

    // 状態のリセット (ホスト・シングル共通)
    this.resetLocalRoundState();

    if (!this.isNetworkGame) {
      this.initDeck();
      this.deal();
      this.renderer.render(this);
      this.renderer.log(`=== ラウンド ${this.roundCount} 開始 ===`);
      // deal() calls nextTurn() via checkHandConditions
    } else {

      // ネットワークラウンドのリセット
      this.renderer.log("次のラウンドの準備中...");

      // ホストのみラウンド数をインクリメントする処理を削除し、一律で上部のインクリメントを使用
      // 以前のロジックではホストが2重にインクリメントしてズレが生じていた

      try {
        // 1. 次のラウンドの準備完了状態をセット (ターゲット = 現在のラウンド数)
        // nextRound()の冒頭で既にインクリメントされているため、ホストもゲストも同じ値になるはず
        const targetRound = this.roundCount;

        console.log(`Setting Ready for Round ${targetRound}`);
        await this.network.setReadyForNextRound(targetRound);

        if (this.network.isHost) {
          this.renderer.log("全員の準備完了を待っています...");
          // 2. 全員がターゲットラウンドの準備完了になるのを待機
          await this.network.waitForAllPlayersReady(targetRound);

          // ホスト: 新しいラウンドの開始処理
          this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (ホスト) ===`);

          // 山札の作成と配布
          this.initDeck();
          this.deal();

          // 手札情報のシリアライズ
          const handsData = this.players.map(p => p.hand.map(c => ({ type: c.type, id: c.id })));

          // ゲストへの初期状態送信
          this.network.setInitialState({
            hands: handsData,
            turn: this.turnPlayerIndex,
            round: this.roundCount,
            players: null
          });

          // 新しいラウンドの手番（書き込み権限）の同期
          this.syncTurnToNetwork();

          this.renderer.render(this);
          // deal() calls nextTurn() via checkHandConditions
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
        // 王の場合、2枚目（インデックス1）を玉として扱う
        if (type === CARD_TYPES.KING) {
          if (i === 1) card.isJewel = true;
        }
        this.deck.push(card);
      }
    }
    // シャッフル
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
    // ネットワーク対戦の場合、ホストのみが判定を行い、結果を同期する
    // シングルプレイの場合はローカルでチェック
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

    // 味方同士の五し判定 (プレイヤー0&2 または 1&3)
    if (shiCounts[0] === 5 && shiCounts[2] === 5) {
      conditions.push({ type: 'team5shi', team: 0, score: 150 });
    }
    if (shiCounts[1] === 5 && shiCounts[3] === 5) {
      conditions.push({ type: 'team5shi', team: 1, score: 150 });
    }

    // 優先順位: 味方五し > 8し > 7し > 6し > 5し
    // ただし、全ての条件について「宣言」の確認を行うフローに変更
    if (conditions.length > 0) {
      this.startManualConditionCheck(conditions);
    } else {
      // 何もなければゲーム開始
      this.nextTurn();
    }
  }

  // 手札条件の手動チェックフロー開始
  async startManualConditionCheck(conditions) {
    this.pendingConditions = conditions;
    this.currentConditionIndex = 0;
    this.processNextCondition();
  }

  processNextCondition() {
    if (this.currentConditionIndex >= this.pendingConditions.length) {
      // 全ての条件チェック完了 -> 有効なものがなければゲーム開始、あれば処理済み
      // ここに来る＝全てスルーされた場合
      this.pendingConditions = null;
      this.nextTurn();
      return;
    }

    const condition = this.pendingConditions[this.currentConditionIndex];
    const player = this.players[condition.playerId !== undefined ? condition.playerId : condition.team]; // team5shiの場合はteamIDを使用

    // 自動処理される条件（8し、7し、6し、味方5し）は即座に適用（ルールによるが、今回は5しのみ手動とするか、全て手動とするか）
    // 要望は「5し等のルールの状況が発生したら宣言するかどうかのボタン...」なので、5し以外も対象と解釈可能だが、
    // 8し等は即勝利なので宣言しない理由がない。
    // しかし、5しは「配り直し」のリスクがあるため戦略的スルーがあり得る。
    // ここでは「5し」のみ手動宣言とし、他は自動適用とする（または要望に合わせて全て手動にする）

    // User Request: 「5し」ルールの宣言動作。
    // 一般的に8し等は強制勝利/得点なので自動でよいが、UI統一のため全てダイアログを出す設計も可。
    // 今回は「5し」のみ特別扱いする実装にする。

    if (condition.type === '5shi') {
      this.renderer.log(`プレイヤー ${player.id} に「五し」の可能性があります...`);

      // 本人に確認
      if (!this.isNetworkGame) {
        if (player.isHuman) {
          this.renderer.showFiveShiDialog(
            () => this.handleFiveShiDeclaration(player.id, true),
            () => this.handleFiveShiDeclaration(player.id, false)
          );
        } else {
          // CPU: 確率で宣言（とりあえず100%宣言）
          setTimeout(() => this.handleFiveShiDeclaration(player.id, true), 1000);
        }
      } else {
        // ネットワーク: ホストが該当プレイヤーに「宣言判断依頼」を送る必要はない。
        // ホスト側で検知しているので、該当プレイヤーにUIを出させるメッセージを送る。
        // NetworkManagerに sendAskForDeclaration(playerId) が必要だが、
        // 既存の仕組みに乗せるなら、checkHandConditionsはホストのみ実行なので、
        // ホストから全クライアントに「P_X has condition option」を通知し、
        // P_Xのクライアントが反応してUIを出し、結果を返す。

        // 簡略化のため、ホストが全クライアントに「DeclarationCheck」イベントを投げる
        this.network.sendFiveShiDeclaration({
          type: 'check',
          playerId: player.id,
          condition: condition
        });
      }
    } else {
      // 5し以外（即勝利系）は自動適用
      this.handleSpecialWin(condition);
      // 特殊勝利でゲーム終わるならここで終了だが、続行なら次へ？
      // handleSpecialWin内で gameOver = true になるのでループは止まるはず
    }
  }

  // 宣言結果の受信処理
  async handleFiveShiDeclaration(playerId, declared) {
    if (this.isNetworkGame && this.network.isHost) {
      this.network.sendFiveShiDeclaration({ type: 'result', playerId, declared });
    }

    const currentCondition = this.pendingConditions ? this.pendingConditions[this.currentConditionIndex] : null;
    const pName = this.getPlayerName(playerId);

    if (declared) {
      this.renderer.log(`${pName} が「五し」を宣言しました！`);
      if (currentCondition) {
        const partnerId = (playerId + 2) % 4;
        this.askPartnerRedeal(playerId, partnerId);
      }
    } else {
      this.renderer.log(`${pName} は宣言しませんでした。`);
      this.currentConditionIndex++;
      this.processNextCondition();
    }
  }

  handleNetworkFiveShiDeclaration(data) {
    if (data.type === 'check') {
      if (data.playerId === this.localPlayerIndex) {
        const pName = this.getPlayerName(data.playerId);
        this.renderer.log(`${pName} (あなた) の五し宣言を確認中...`);
        setTimeout(() => {
          this.renderer.showFiveShiDialog(
            () => {
              this.network.sendFiveShiDeclaration({ type: 'result', playerId: this.localPlayerIndex, declared: true });
            },
            () => {
              this.network.sendFiveShiDeclaration({ type: 'result', playerId: this.localPlayerIndex, declared: false });
            }
          );
        }, 100);
      } else {
        const pName = this.getPlayerName(data.playerId);
        this.renderer.log(`${pName} が五しの宣言を検討中...`);
      }
    } else if (data.type === 'result') {
      if (this.network.isHost) {
        this.handleFiveShiDeclaration(data.playerId, data.declared);
      } else {
        const pName = this.getPlayerName(data.playerId);
        if (data.declared) this.renderer.log(`${pName} が五しを宣言しました！`);
        else this.renderer.log(`${pName} は宣言しませんでした。`);
      }
    }
  }

  askPartnerRedeal(declarerId, partnerId) {
    const partnerName = this.getPlayerName(partnerId);
    this.renderer.log(`相方(${partnerName}) が配り直しを判断中...`);

    if (!this.isNetworkGame) {
      if (partnerId === 0) { // Local Human
        this.renderer.showPartnerRedealDialog(
          declarerId,
          () => this.handlePartnerDecision(partnerId, true),
          () => this.handlePartnerDecision(partnerId, false)
        );
      } else {
        // CPU
        setTimeout(() => this.handlePartnerDecision(partnerId, true), 1000);
      }
    } else {
      if (this.network.isHost) {
        this.network.sendPartnerDecision({ type: 'check', partnerId, declarerId });
      }
    }
  }

  async handlePartnerDecision(partnerId, redeal) {
    if (this.isNetworkGame && this.network.isHost) {
      this.network.sendPartnerDecision({ type: 'result', partnerId, redeal });
    }

    if (redeal) {
      this.renderer.log(`${this.getPlayerName(partnerId)} が配り直しを選択しました。`);
      if (this.isNetworkGame) {
        if (this.network.isHost) this.network.sendRedeal(); // ホストがRedeal命令
      } else {
        this.redeal();
      }
    } else {
      this.renderer.log(`${this.getPlayerName(partnerId)} は続行を選択しました。`);
      // 次の条件へ（もしあれば）
      this.currentConditionIndex++;
      this.processNextCondition();
    }
  }

  handleNetworkPartnerDecision(data) {
    if (data.type === 'check') {
      if (data.partnerId === this.localPlayerIndex) {
        const pName = this.getPlayerName(data.partnerId);
        this.renderer.log(`${pName} (あなた) が配り直しを判断中...`);
        setTimeout(() => {
          this.renderer.showPartnerRedealDialog(
            data.declarerId,
            () => this.network.sendPartnerDecision({ type: 'result', partnerId: this.localPlayerIndex, redeal: true }),
            () => this.network.sendPartnerDecision({ type: 'result', partnerId: this.localPlayerIndex, redeal: false })
          );
        }, 100);
      } else {
        const pName = this.getPlayerName(data.partnerId);
        this.renderer.log(`${pName} が配り直しを判断中...`);
      }
    } else if (data.type === 'result') {
      if (this.network.isHost) {
        this.handlePartnerDecision(data.partnerId, data.redeal);
      } else {
        const pName = this.getPlayerName(data.partnerId);
        const choice = data.redeal ? "配り直し" : "続行";
        this.renderer.log(`${pName} は ${choice} を選択しました。`);
      }
    }
  }
  handleSpecialWin(condition) {
    this.renderer.log(`特殊勝利条件: ${condition.type}`);

    // 特殊勝利したプレイヤーの手札を公開
    if (condition.playerId !== undefined) {
      const player = this.players[condition.playerId];
      player.revealHand = true; // 手札公開フラグをセット
      this.renderer.render(this); // UI更新
    } else if (condition.type === 'team5shi') {
      // 味方五しの場合、両方の手札を公開
      const team = condition.team;
      this.players[team].revealHand = true;
      this.players[team + 2].revealHand = true;
      this.renderer.render(this);
    }

    // UI描画を待機
    setTimeout(() => {
      let winnerId = condition.playerId;
      if (condition.type === 'team5shi') winnerId = condition.team; // チームインデックス

      // スコア更新
      this.teamScores[winnerId % 2] += condition.score;
      this.renderer.updateScores(this.teamScores);

      // 結果表示
      this.gameOver = true; // 実質的なラウンド終了
      this.renderer.showRoundResult(winnerId, condition.score, this.teamScores.some(s => s >= 150), condition);

      if (this.isNetworkGame) {
        this.network.sendSpecialWin(condition);
      }
    }, 1000);
  }

  getPlayerName(index) {
    if (this.renderer && this.renderer.playerNames && this.renderer.playerNames[index]) {
      return this.renderer.playerNames[index];
    }
    const p = this.players[index];
    if (p && !p.isHuman) {
      return `CPU ${index}`;
    }
    return `プレイヤー ${index}`;
  }

  handleFiveShiScenarios(fiveShiList) {
    const names = fiveShiList.map(c => this.getPlayerName(c.playerId));
    this.renderer.log(`五し: ${names.join(', ')}`);

    // 味方五しは上記で処理済み
    // 敵・味方それぞれの五し判定
    const team0Count = fiveShiList.filter(c => c.playerId % 2 === 0).length;
    const team1Count = fiveShiList.filter(c => c.playerId % 2 === 1).length;

    if (team0Count > 0 && team1Count > 0) {
      // 敵味方五し: 両方の相方が配り直しを選択する必要がある
      this.handleEnemyAllyFiveShi(fiveShiList);
    } else {
      // 単独五し: 相方が判断
      this.handleSingleFiveShi(fiveShiList[0]);
    }
  }

  handleSingleFiveShi(condition) {
    const playerId = condition.playerId;
    const partnerId = (playerId + 2) % 4;
    const pName = this.getPlayerName(playerId);
    const partnerName = this.getPlayerName(partnerId);

    this.renderer.log(`${pName} が「五し」。相方(${partnerName})が判断します。`);

    if (!this.isNetworkGame) {
      // シングルプレイ: 相方に尋ねる
      if (partnerId === 0) {
        // 人間の相方
        this.renderer.showFiveShiDialog(
          () => this.redeal(),
          () => this.renderer.log("続行します。")
        );
      } else {
        // CPUの相方: 自動判断 (現在は配り直し)
        this.renderer.log(`CPU (${partnerName}) が配り直しを選択しました。`);
        setTimeout(() => this.redeal(), 1000);
      }
    } else {
      // ネットワーク: partnerIdを含むイベント送信
      this.network.sendFiveShiEvent({ ...condition, partnerId });
    }
  }

  handleEnemyAllyFiveShi(fiveShiList) {
    this.renderer.log("敵・味方それぞれ一人が「五し」です。両相方が配り直しを選択した場合のみ配り直します。");

    // 保留中の決定を保存
    this.pendingFiveShiDecisions = {
      players: fiveShiList.map(c => c.playerId),
      decisions: {} // partnerId -> true/false
    };

    // 各相方に確認
    fiveShiList.forEach(condition => {
      const playerId = condition.playerId;
      const partnerId = (playerId + 2) % 4;

      if (!this.isNetworkGame) {
        if (partnerId === 0) {
          // 人間の相方
          this.renderer.showFiveShiDialog(
            () => this.recordFiveShiDecision(partnerId, true),
            () => this.recordFiveShiDecision(partnerId, false)
          );
        } else {
          // CPUの相方: 自動判断
          setTimeout(() => this.recordFiveShiDecision(partnerId, true), 1000);
        }
      } else {
        // ネットワーク: イベント送信
        this.network.sendFiveShiEvent({ ...condition, partnerId, isEnemyAllyScenario: true });
      }
    });
  }

  recordFiveShiDecision(partnerId, wantsRedeal) {
    if (!this.pendingFiveShiDecisions) return;

    this.pendingFiveShiDecisions.decisions[partnerId] = wantsRedeal;
    this.renderer.log(`P${partnerId} が ${wantsRedeal ? '配り直し' : '続行'} を選択。`);

    // 全員の決定が揃ったか確認
    const allDecided = this.pendingFiveShiDecisions.players.every(pId => {
      const partnerId = (pId + 2) % 4;
      return this.pendingFiveShiDecisions.decisions[partnerId] !== undefined;
    });

    if (allDecided) {
      // 両方の相方が配り直しを選択する必要がある
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

    // ネットワークロジック
    if (this.isNetworkGame) {
      const amIHost = this.network.isHost;
      const isMyTurn = (this.turnPlayerIndex === this.localPlayerIndex);

      // 現在のプレイヤーがNPCかチェック (ホストが制御)
      // setupPlayersFromNetwork で isHuman フラグが設定されている前提
      // 注: ネットワークモードでは isHuman は「実在の人間」を意味する
      // なので !isHuman はNPC

      const isNpc = !player.isHuman;

      if (amIHost && isNpc) {
        // ホストがNPCを制御 -> AIロジックへ
      } else if (!isMyTurn) {
        return; // リモート待機
      }
    }

    // アクション取得 (人間またはAI)
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
    const isLead = !this.currentAttack; // 実行前に攻め手番かチェック

    // 1. ローカルで検証・実行
    const result = await this.executeActionLogic(player, action);

    if (this.isNetworkGame) {
      // 2. ネットワークへ送信
      const cleanAction = { ...action, playerIndex: player.id };

      // カード情報の整形
      if (cleanAction.card1) cleanAction.card1 = { type: cleanAction.card1.type, id: cleanAction.card1.id, isJewel: cleanAction.card1.isJewel };
      if (cleanAction.card2) cleanAction.card2 = { type: cleanAction.card2.type, id: cleanAction.card2.id, isJewel: cleanAction.card2.isJewel };

      // 【修正】プライバシー保護はexecuteActionLogic内の表示処理で行うため、
      // ネットワークには正しいデータを送信する（スコア計算や整合性チェックのため）

      this.renderer.logNetwork(`Sending Action: P${player.id} ${action.action}`);
      await this.network.sendGameAction(cleanAction);

      // 3. 手番の変更を同期
      // 自分がプレイした場合、手番（turn）の更新権限は自分にあるため更新を行う
      await this.syncTurnToNetwork();
    }

    // Resume Turn Loop (After Action + Network Sync)
    this.nextTurn();

    return result;
  }

  async handleRemoteAction(remoteAction) {
    this.renderer.logNetwork(`Received Action: P${remoteAction.playerIndex} ${remoteAction.action}`);
    // console.log("Received Remote Action:", remoteAction);
    if (this.gameOver) return; // Prevent action if game ended

    // Check if this action is for the current/expected turn?
    // NetworkManager ensures order but logical check is good.

    if (remoteAction.playerIndex === this.localPlayerIndex) {
      this.renderer.logNetwork(`IGNORED (Self Index: ${this.localPlayerIndex})`);
      return;
    }
    if (remoteAction.playerId === this.network.playerId) {
      this.renderer.logNetwork(`IGNORED (Self ID)`);
      return;
    }

    const player = this.players[remoteAction.playerIndex];

    // カードオブジェクトの再構築
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

    const pName = this.getPlayerName(player.id);
    this.renderer.log(`${pName} のアクション`); // Localized log
    await this.executeActionLogic(player, remoteAction);

    // Resume Turn Loop (After Remote Action)
    if (!this.gameOver) {
      this.nextTurn();
    }
  }

  // 再利用のためのロジック分離
  async executeActionLogic(player, action) {
    if (action.action === 'pass') {
      if (!this.currentAttack) {
        return { valid: false, reason: "攻めの手番ではパスできません" };
      }
      this.passCount++;
      const pName = this.getPlayerName(player.id);
      this.renderer.log(`${pName}: なし`);

      if (this.passCount >= 3) {
        const winnerIndex = this.currentAttack.playerIndex;
        // トリック終了
        this.renderer.log("3人パス -> 場が流れました");
        // 前回の攻撃プレイヤーが親になる
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

      // === 王のルール検証 ===
      // 王で攻める場合、手札（これから出すカード含む）と場の王の合計が2枚以上必要
      if (card2.type === CARD_TYPES.KING) {
        const kingInHand = player.hand.filter(c => c.type === CARD_TYPES.KING).length;
        // ロジック: 手札の王 + 場の王 >= 2
        // 注: card1, card2はこの時点ではまだ手札にある
        if ((kingInHand + this.visibleKingCount) < 2) {
          return { valid: false, reason: "王(玉)で攻めるには、もう一枚の王(玉)が必要です (手札または場)" };
        }
      }

      // 状態に基づく有効性チェック
      if (!this.currentAttack) {
        // === 攻め (LEAD) ===
        player.removeCard(card1);
        player.removeCard(card2);

        const cardName = card2.isJewel ? "玉" : card2.type;
        const pName = this.getPlayerName(player.id);
        this.renderer.log(`${pName} 攻め: [伏せ] -> ${cardName}`);
        this.renderer.showPlay(player.id, card1, card2, true);

        if (card2.type === CARD_TYPES.KING) this.visibleKingCount++;

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const isDouble = (card1.type === card2.type);
        // 【修正】ダブル（同種2枚）であっても、上がり（手札0枚）でなければ公開しない
        if (isDouble && player.hand.length === 0) {
          this.renderer.revealLastLead(player.id, card1);
        }

        const roundEnded = await this.checkWin(player, isDouble);

        if (!this.gameOver && !roundEnded) {
          this.turnPlayerIndex = (this.turnPlayerIndex + 1) % 4;
          // nextTurn() removed - called by caller
        }
        return { valid: true };

      } else {
        // === 受け (COUNTER) ===
        const attackType = this.currentAttack.card.type;
        const defType = card1.type;

        let validDef = (attackType === defType);
        // 王のルール
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
        const pName = this.getPlayerName(player.id);
        this.renderer.log(`${pName} 受け・攻め: ${c1Name} -> ${c2Name}`);
        this.renderer.showPlay(player.id, card1, card2, false);

        if (card1.type === CARD_TYPES.KING) this.visibleKingCount++;
        if (card2.type === CARD_TYPES.KING) this.visibleKingCount++;

        this.currentAttack = { playerIndex: player.id, card: card2 };
        this.passCount = 0;

        this.renderer.render(this);

        const isDouble = (card1.type === card2.type);

        // 受けのダブル（同種2枚）の場合は公開（強調表示）
        if (isDouble) {
          // 受けの場合、card1は元々公開状態（非表示ではない）だが、ダブルとして強調する
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
    // nextTurn() は呼び出し元で行われる
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
      return true; // ラウンド終了
    }
    return false; // ラウンド継続
  }
}
