import { NetworkManager } from '../network/NetworkManager.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.selectedCards = [];
    this.playerNames = { 0: "あなた", 1: "CPU 左", 2: "CPU 対面", 3: "CPU 右" };

    this.network = new NetworkManager();
    this.network.onRoomUpdate = (data) => this.updateLobby(data);

    // Start with Start Screen
    this.setupStartScreen();
  }

  // === SCREEN 1: Title & Mode Select ===
  setupStartScreen() {
    this.container.innerHTML = `
        <div id="start-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light);">
            <h1 style="font-size:3em; margin-bottom:40px; text-shadow:2px 2px 4px black;">May be ごいた</h1>
            <div style="display:flex; gap:20px;">
                <button id="btn-mode-single" style="font-size:1.5em; padding:20px 40px; min-width:200px;">シングルプレイ<br><span style="font-size:0.6em">(1人 vs 3CPU)</span></button>
                <button id="btn-mode-multi" style="font-size:1.5em; padding:20px 40px; min-width:200px;">マルチプレイ<br><span style="font-size:0.6em">(通信対戦)</span></button>
            </div>
        </div>
      `;

    document.getElementById('btn-mode-single').onclick = () => this.setupSinglePlayerSetup();
    document.getElementById('btn-mode-multi').onclick = () => this.setupMultiplayerMenu();
  }

  // === SCREEN 2A: Single Player Setup ===
  setupSinglePlayerSetup() {
    this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light);">
            <h2 style="font-size:2em; margin-bottom:20px;">シングルプレイ設定</h2>
            <div style="background:rgba(0,0,0,0.5); padding:30px; border-radius:15px; text-align:center; border:2px solid var(--wood-dark);">
                <label style="font-size:1.2em; display:block; margin-bottom:10px;">プレイヤー名</label>
                <input type="text" id="input-player-name" placeholder="名前を入力" style="padding:10px; font-size:1.2em; border-radius:5px; border:none; width:200px; text-align:center;">
                <br><br>
                <button id="btn-start-single" style="font-size:1.5em; padding:10px 40px;">ゲーム開始</button>
                <br><br>
                <button id="btn-back" style="font-size:1em; background:transparent; border:1px solid #aaa; color:#aaa;">戻る</button>
            </div>
        </div>
      `;

    document.getElementById('btn-back').onclick = () => this.setupStartScreen();
    document.getElementById('btn-start-single').onclick = () => {
      const name = document.getElementById('input-player-name').value.trim();
      if (name) {
        this.playerNames[0] = name;
        this.setupGameUI();
        if (window.game) window.game.start();
      } else {
        alert("名前を入力してください");
      }
    };
  }

  // === SCREEN 2B: Multiplayer Menu ===
  setupMultiplayerMenu() {
    this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light);">
            <h2 style="font-size:2em; margin-bottom:20px;">マルチプレイ</h2>
            <div style="background:rgba(0,0,0,0.5); padding:30px; border-radius:15px; text-align:center; border:2px solid var(--wood-dark); min-width:300px;">
                <label style="font-size:1.2em; display:block; margin-bottom:10px;">プレイヤー名</label>
                <input type="text" id="input-multi-name" placeholder="名前を入力" style="padding:10px; font-size:1.2em; border-radius:5px; border:none; width:200px; text-align:center; margin-bottom:20px;">
                
                <hr style="border-color:#666; margin:20px 0;">

                <button id="btn-create-room" style="font-size:1.2em; padding:10px 30px; width:100%; margin-bottom:10px;">部屋を作成</button>
                <div style="margin:10px 0;">または</div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <input type="text" id="input-room-code" placeholder="あいことば" style="padding:10px; width:120px; text-align:center;">
                    <button id="btn-join-room" style="font-size:1.2em; padding:10px 20px;">参加</button>
                </div>

                <br>
                <button id="btn-back" style="font-size:1em; background:transparent; border:1px solid #aaa; color:#aaa;">戻る</button>
            </div>
        </div>
      `;

    document.getElementById('btn-back').onclick = () => this.setupStartScreen();

    const getName = () => document.getElementById('input-multi-name').value.trim();

    document.getElementById('btn-create-room').onclick = async () => {
      const name = getName();
      if (!name) return alert("名前を入力してください");

      const res = await this.network.createRoom(name);
      if (res.success) {
        this.setupLobby();
      } else {
        alert("エラー: " + res.error);
      }
    };

    document.getElementById('btn-join-room').onclick = async () => {
      const name = getName();
      const code = document.getElementById('input-room-code').value.trim();
      if (!name) return alert("名前を入力してください");
      if (!code) return alert("あいことばを入力してください");

      const res = await this.network.joinRoom(code, name);
      if (res.success) {
        this.setupLobby();
      } else {
        alert("エラー: " + res.error);
      }
    };
  }

  // === SCREEN 3: Lobby ===
  setupLobby() {
    this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light);">
            <h2 style="font-size:2em; margin-bottom:10px;">ロビー待機中</h2>
            <div style="font-size:1.5em; margin-bottom:20px;">
                あいことば: <span id="lobby-room-code" style="font-weight:bold; color:#f1c40f; font-size:1.5em;">Loading...</span>
            </div>

            <div id="lobby-players" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
                <!-- Player Slots -->
            </div>

            <div id="host-controls" style="display:none;">
                <button id="btn-start-multi" style="font-size:1.5em; padding:10px 40px;">ゲーム開始</button>
            </div>
            <div id="guest-msg" style="display:none;">
                ホストが開始するのを待っています...
            </div>
            
            <br>
            <button id="btn-leave-room" style="font-size:1em; background:transparent; border:1px solid #aaa; color:#aaa;">退出</button>
        </div>
      `;

    document.getElementById('btn-leave-room').onclick = () => {
      // TODO: Leave room logic
      location.reload();
    };

    document.getElementById('btn-start-multi').onclick = () => {
      this.network.startGame();
    };
  }

  updateLobby(roomData) {
    if (!document.getElementById('lobby-room-code')) return; // Not in lobby

    if (!roomData) {
      alert("部屋が解散されました");
      this.setupMultiplayerMenu();
      return;
    }

    document.getElementById('lobby-room-code').textContent = this.network.currentRoomId;

    const playersDiv = document.getElementById('lobby-players');
    playersDiv.innerHTML = '';

    // 4 Slots
    for (let i = 0; i < 4; i++) {
      const p = Object.values(roomData.players || {}).find(p => p.index === i);
      const slot = document.createElement('div');
      slot.style.border = "2px solid var(--wood-dark)";
      slot.style.padding = "20px";
      slot.style.borderRadius = "10px";
      slot.style.background = "rgba(0,0,0,0.3)";
      slot.style.width = "150px";
      slot.style.textAlign = "center";

      if (p) {
        slot.innerHTML = `
                <div style="font-size:1.2em; font-weight:bold;">${p.name}</div>
                <div style="font-size:0.8em; color:#aaa;">${p.isHost ? "HOST" : "READY"}</div>
              `;
      } else {
        slot.innerHTML = `<div style="color:#666;">募集中...</div>`;
      }
      playersDiv.appendChild(slot);
    }

    // Controls
    if (this.network.isHost) {
      document.getElementById('host-controls').style.display = 'block';
      document.getElementById('guest-msg').style.display = 'none';
    } else {
      document.getElementById('host-controls').style.display = 'none';
      document.getElementById('guest-msg').style.display = 'block';
    }

    if (roomData.status === 'playing') {
      // Game Started. NetworkManager triggers onGameStart -> GoitaBoard -> setupGameUI
    }
  }

  setupGameUI() {
    this.container.innerHTML = `
          <div id="game-board">
            <div id="center-info">
                 <div class="score-board">
                    <div class="team-score team-0">チームA (<span id="name-0-score">${this.playerNames[0]}</span>): <span id="score-0">0</span></div>
                    <div class="team-score team-1">チームB (CPU): <span id="score-1">0</span></div>
                 </div>
                 <div id="turn-info" style="margin-top: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 4px;">準備中...</div>
                 <div id="log-short"></div>
            </div>

            <div id="result-modal" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); color:white; padding:20px; border-radius:10px; z-index:200; text-align:center; min-width:300px; border: 2px solid #d4a76a;">
                <h2 id="result-title">ラウンド終了</h2>
                <div id="result-msg" style="margin:20px 0; font-size:1.2em;"></div>
                <button id="btn-next-round">次のラウンドへ</button>
            </div>

            <!-- Player Areas with Name Tags -->
            <div id="player-2" class="player-area player-top team-0">
                 <div class="name-tag">${this.playerNames[2]}</div>
                 <div class="field-area">
                     <div class="row-receive"></div>
                     <div class="row-attack"></div>
                 </div>
                 <div class="hand"></div>
                 <div class="status-bubble"></div>
            </div>
            <div id="player-3" class="player-area player-right team-1">
                 <div class="name-tag">${this.playerNames[3]}</div>
                 <div class="field-area">
                     <div class="row-receive"></div>
                     <div class="row-attack"></div>
                 </div>
                 <div class="hand"></div>
                 <div class="status-bubble"></div>
            </div>
            <div id="player-1" class="player-area player-left team-1">
                 <div class="name-tag">${this.playerNames[1]}</div>
                 <div class="field-area">
                     <div class="row-receive"></div>
                     <div class="row-attack"></div>
                 </div>
                 <div class="hand"></div>
                 <div class="status-bubble"></div>
            </div>
            <div id="player-0" class="player-area player-bottom team-0">
                 <div class="field-area">
                     <div class="row-receive"></div>
                     <div class="row-attack"></div>
                 </div>
                 <div class="hand"></div>
                 <div class="status-bubble"></div>
                 <div class="name-tag" style="margin-top:5px;">${this.playerNames[0]}</div>
            </div>
          </div>

          <div id="controls">
             <button id="btn-pass">なし (パス)</button>
             <button id="btn-action">決定</button>
          </div>
    `;

    document.getElementById('btn-pass').onclick = () => window.game.handleHumanAction({ action: 'pass' });
    document.getElementById('btn-action').onclick = () => this.submitAction();
    document.getElementById('btn-next-round').onclick = () => {
      document.getElementById('result-modal').style.display = 'none';
      if (this.nextRoundCallback) this.nextRoundCallback();
    };
  }

  render(game) {
    if (!document.getElementById('player-0')) return;

    game.players.forEach(p => this.renderHand(p));
    if (game.teamScores) this.updateScores(game.teamScores);

    const infoEl = document.getElementById('turn-info');
    if (game.gameOver) {
      infoEl.textContent = "ゲーム終了";
    } else {
      const turnPlayerId = game.turnPlayerIndex;
      const turnPlayerName = this.playerNames[turnPlayerId];
      const isMyTurn = (turnPlayerId === 0);

      let msg = "";

      if (game.currentAttack) {
        if (isMyTurn) {
          msg = `あなたの番: 受け [${game.currentAttack.card.type}]`;
          infoEl.style.color = "#e74c3c";
        } else {
          msg = `${turnPlayerName} の番 (受け: ${game.currentAttack.card.type})`;
          infoEl.style.color = "#ffffff";
        }
      } else {
        if (isMyTurn) {
          msg = `あなたの番: 攻め (Lead)`;
          infoEl.style.color = "#00ff00";
        } else {
          msg = `${turnPlayerName} の番 (攻め)`;
          infoEl.style.color = "#ffffff";
        }
      }

      infoEl.textContent = msg;
    }

    this.updateControls(game);
  }

  updateControls(game) {
    const btnAction = document.getElementById('btn-action');
    if (!btnAction) return;

    const isMyTurn = (game.turnPlayerIndex === 0 && !game.gameOver);

    const btnPass = document.getElementById('btn-pass');
    btnPass.disabled = !isMyTurn;

    // Pass is only valid if not leading
    if (!game.currentAttack && isMyTurn) btnPass.disabled = true;

    btnAction.disabled = !isMyTurn;
    if (isMyTurn) {
      if (game.currentAttack) {
        btnAction.textContent = "受けて攻める";
      } else {
        btnAction.textContent = "攻める";
      }
    }
  }

  enableControls(enable) {
    const btnAction = document.getElementById('btn-action');
    const btnPass = document.getElementById('btn-pass');
    if (!btnAction) return;

    if (enable) {
      btnAction.disabled = false;
      btnPass.disabled = false;
    } else {
      btnAction.disabled = true;
      btnPass.disabled = true;
    }
  }

  renderHand(player) {
    const elId = `player-${player.id}`;
    const pArea = this.container.querySelector(`#${elId}`);
    if (!pArea) return;

    const handEl = pArea.querySelector('.hand');
    handEl.innerHTML = '';

    player.hand.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      if (!player.isHuman) {
        cardEl.classList.add('hidden');
      } else {
        cardEl.textContent = card.type;
        cardEl.onclick = () => this.toggleSelect(card, cardEl);
        // Double click interaction
        cardEl.ondblclick = () => this.handleDoubleClick(card, cardEl);
      }

      if (this.selectedCards.find(c => c.id === card.id)) {
        cardEl.classList.add('selected');
      }

      handEl.appendChild(cardEl);
    });
  }

  toggleSelect(card, el) {
    if (this.selectedCards.some(c => c.id === card.id)) {
      this.selectedCards = this.selectedCards.filter(c => c.id !== card.id);
      el.classList.remove('selected');
    } else {
      if (this.selectedCards.length >= 2) return;
      this.selectedCards.push(card);
      el.classList.add('selected');
    }
  }

  handleDoubleClick(card, el) {
    const game = window.game;
    if (game.turnPlayerIndex !== 0) return;
    if (game.gameOver) return;

    if (this.selectedCards.length === 1 && !this.selectedCards.some(c => c.id === card.id)) {
      this.selectedCards.push(card);
      el.classList.add('selected');
      this.submitAction();
      return;
    }

    if (this.selectedCards.length === 0) {
      this.toggleSelect(card, el);
    }
  }

  submitAction() {
    if (this.selectedCards.length !== 2) {
      alert("カードを2枚選択してください (受け・攻め、または伏せ・攻め)");
      return;
    }

    window.game.handleHumanAction({
      action: 'playTurn',
      card1: this.selectedCards[0],
      card2: this.selectedCards[1]
    });
    this.selectedCards = [];
  }

  showPlay(playerId, card1, card2, isLead) {
    const pArea = this.container.querySelector(`#player-${playerId}`);
    if (!pArea) return;

    const rowRec = pArea.querySelector('.row-receive');
    const rowAtt = pArea.querySelector('.row-attack');

    // Card 1 -> Receive Row
    const c1 = document.createElement('div');
    c1.className = 'card small';
    if (isLead) {
      c1.classList.add('hidden');
      c1.classList.add('lead-hidden');
    } else {
      c1.textContent = card1.type;
    }

    // Card 2 -> Attack Row
    const c2 = document.createElement('div');
    c2.className = 'card small';
    c2.textContent = card2.type;

    rowRec.appendChild(c1);
    rowAtt.appendChild(c2);

    // Bubbles
    const actionName = isLead ? "攻" : "受・攻";
    this.showBubble(playerId, `${actionName}: ${card2.type}`);
  }

  showBubble(playerId, text) {
    const bubble = this.container.querySelector(`#player-${playerId} .status-bubble`);
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 2000);
    }
  }

  updateScores(scores) {
    const s0 = document.getElementById('score-0');
    const s1 = document.getElementById('score-1');
    if (s0) s0.textContent = scores[0];
    if (s1) s1.textContent = scores[1];
  }

  showRoundResult(winnerId, score, isGameWin) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const msg = document.getElementById('result-msg');
    const btn = document.getElementById('btn-next-round');

    const teamName = (winnerId % 2 === 0) ? "チームA (あなた/味方)" : "チームB (相手)";
    const winText = isGameWin ? "勝負あり！" : "ラウンド終了";

    title.textContent = winText;
    msg.innerHTML = `勝者: プレイヤー ${winnerId} (${teamName})<br>得点: +${score}`;

    if (isGameWin) {
      btn.textContent = "リロードして再開";
      this.nextRoundCallback = () => location.reload();
    } else {
      btn.textContent = "次のラウンドへ";
      this.nextRoundCallback = () => window.game.nextRound(winnerId);
    }

    modal.style.display = 'block';
  }

  clearField() {
    const rows = this.container.querySelectorAll('.row-receive, .row-attack');
    rows.forEach(r => r.innerHTML = '');
  }

  log(msg) {
    const logEl = document.getElementById('log-short');
    if (logEl) {
      logEl.textContent = msg;
      logEl.style.opacity = 1;
      setTimeout(() => logEl.style.opacity = 0, 3000);
    }
    console.log(msg);
  }

  highlightPlayer(id) {
    const areas = this.container.querySelectorAll('.player-area');
    areas.forEach(a => a.style.filter = "brightness(0.7)");
    const active = this.container.querySelector(`#player-${id}`);
    if (active) active.style.filter = "brightness(1.0)";
  }

  updateNameTags() {
    for (let i = 0; i < 4; i++) {
      const pArea = this.container.querySelector(`#player-${i}`);
      if (pArea) {
        const nameTag = pArea.querySelector('.name-tag');
        if (nameTag) nameTag.textContent = this.playerNames[i];

        // Also update score board name for Player 0
        if (i === 0) {
          const scoreName = document.getElementById('name-0-score');
          if (scoreName) scoreName.textContent = this.playerNames[0];
        }
      }
    }
  }
}
