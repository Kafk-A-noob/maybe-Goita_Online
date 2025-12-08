import { NetworkManager } from '../network/NetworkManager.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.selectedCards = [];
    this.playerNames = { 0: "あなた", 1: "CPU 左", 2: "CPU 対面", 3: "CPU 右" };
    this.localPlayerIndex = 0; // Default to 0, but will be updated by GoitaBoard

    this.network = new NetworkManager();
    this.network.onRoomUpdate = (data) => this.updateLobby(data);

    // Start with Start Screen
    this.setupStartScreen();
  }

  setLocalPlayer(index) {
    this.localPlayerIndex = index;
    console.log("Renderer: Local Player set to", index);
    this.updateLayout();
  }

  updateLayout() {
    // Rotate the board so localPlayerIndex is at the bottom
    // Order: 0(Me), 1(Next), 2(Opposite), 3(Previous)
    // Clockwise: Bottom -> Left -> Top -> Right
    const positions = ['player-bottom', 'player-left', 'player-top', 'player-right'];

    for (let i = 0; i < 4; i++) {
      const pArea = document.getElementById(`player-${i}`);
      if (pArea) {
        // Calculate relative position
        // Formula: (i - local + 4) % 4
        const offset = (i - this.localPlayerIndex + 4) % 4;
        pArea.className = `player-area ${positions[offset]} team-${i % 2}`;
      }
    }
  }

  // === SCREEN 1: Title & Mode Select ===
  setupStartScreen() {
    this.container.innerHTML = `
        <div id="start-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light); position:relative;">
            <div style="position:absolute; top:10px; right:10px; font-size:0.8em;">
                ID: ${this.network.playerId} 
                <button id="btn-reset-id" style="font-size:0.8em; padding:2px 5px; margin-left:5px;">IDリセット</button>
            </div>
            <div style="position:absolute; bottom:10px; right:10px; font-size:0.9em; color:#999;">
                Ver: 0.8
            </div>
            <h1 style="font-size:3em; margin-bottom:40px; text-shadow:2px 2px 4px black;">May be ごいた Online</h1>
            <div style="display:flex; gap:20px;">
                <button id="btn-mode-single" style="font-size:1.5em; padding:20px 40px; min-width:200px;">シングルプレイ<br><span style="font-size:0.6em">(1人 vs 3CPU)</span></button>
                <button id="btn-mode-multi" style="font-size:1.5em; padding:20px 40px; min-width:200px;">マルチプレイ<br><span style="font-size:0.6em">(通信対戦)</span></button>
            </div>
            <div style="margin-top:30px; display:flex; gap:20px; font-size:0.9em;">
                <a href="https://ja.wikipedia.org/wiki/%E3%81%94%E3%81%84%E3%81%9F" target="_blank" style="color:#4a9eff; text-decoration:none; border-bottom:1px solid #4a9eff;">ごいたとは？</a>
                <span style="color:#666;">|</span>
                <a href="https://goita.jp/wp-content/uploads/2016/11/goita_rule_2nd.pdf" target="_blank" style="color:#4a9eff; text-decoration:none; border-bottom:1px solid #4a9eff;">ルールページ (PDF)</a>
            </div>
        </div>
      `;

    document.getElementById('btn-mode-single').onclick = () => this.setupSinglePlayerSetup();
    document.getElementById('btn-mode-multi').onclick = () => this.setupMultiplayerMenu();
    document.getElementById('btn-reset-id').onclick = () => {
      if (confirm("プレイヤーIDをリセットしますか？\n(同じブラウザで2人プレイする場合などに使用します)")) {
        this.network.resetPlayerId();
        this.setupStartScreen(); // Refresh
      }
    };
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
                    <button id="btn-paste-code" style="font-size:0.8em; padding:10px;">ペースト</button>
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

    document.getElementById('btn-paste-code').onclick = async () => {
      try {
        const text = await navigator.clipboard.readText();
        document.getElementById('input-room-code').value = text;
      } catch (e) { alert("クリップボードの読み取りに失敗しました"); }
    };
  }

  // === SCREEN 3: Lobby ===
  setupLobby() {
    this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--wood-light);">
            <h2 style="font-size:2em; margin-bottom:10px;">ロビー待機中</h2>
            <div style="font-size:1.5em; margin-bottom:20px;">
                あいことば: <span id="lobby-room-code" style="font-weight:bold; color:#f1c40f; font-size:1.5em;">Loading...</span>
                <button id="btn-lobby-copy" style="font-size:0.6em; margin-left:10px; padding:2px 8px;">コピー</button>
            </div>
            <div style="font-size:0.8em; margin-bottom:20px; color:#aaa;">
                あなたのID: ${this.network.playerId}
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

    document.getElementById('btn-lobby-copy').onclick = () => {
      const code = document.getElementById('lobby-room-code').textContent;
      navigator.clipboard.writeText(code);
      const btn = document.getElementById('btn-lobby-copy');
      btn.textContent = "コピー済";
      setTimeout(() => btn.textContent = "コピー", 2000);
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
    this.container.innerHTML = '';

    // 1. Game Board
    const board = document.createElement('div');
    board.id = 'game-board';
    board.innerHTML = `
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
    `;
    this.container.appendChild(board);

    // 2. Controls & Log
    this.container.insertAdjacentHTML('beforeend', `
          <div id="controls">
             <button id="btn-pass">なし (パス)</button>
             <button id="btn-action">決定</button>
          </div>

          <!-- Debug Log Panel -->
          <div id="network-log" style="display:none; position:absolute; top:0; left:0; width:250px; height:400px; overflow-y:scroll; background:rgba(0,0,0,0.8); color:#0f0; font-family:monospace; font-size:10px; z-index:9999; padding:5px; pointer-events:none; opacity:0.8;">
            <div>=== Network Log ===</div>
          </div>
    `);

    // 3. Settings UI
    this.createSettingsUI();

    // 4. Event Listeners
    document.getElementById('btn-pass').onclick = () => window.game.handleHumanAction({ action: 'pass' });
    document.getElementById('btn-action').onclick = () => this.submitAction();
    document.getElementById('btn-next-round').onclick = () => {
      document.getElementById('result-modal').style.display = 'none';
      if (this.nextRoundCallback) this.nextRoundCallback();
    };

    // Initial Layout update
    this.updateLayout();
  }

  render(game) {
    if (!document.getElementById('player-0')) return;

    // Ensure layout is correct
    this.updateLayout();

    game.players.forEach(p => this.renderHand(p));
    if (game.teamScores) this.updateScores(game.teamScores);

    const infoEl = document.getElementById('turn-info');
    if (game.gameOver) {
      infoEl.textContent = "ゲーム終了";
    } else {
      const turnPlayerId = game.turnPlayerIndex;
      let turnPlayerName = this.playerNames[turnPlayerId] || `Player ${turnPlayerId}`;
      const isMyTurn = (turnPlayerId === this.localPlayerIndex);

      if (isMyTurn) turnPlayerName += " (あなた)";

      let line1 = turnPlayerName;
      let line2 = "";

      if (game.currentAttack) {
        const cardName = game.currentAttack.card.isJewel ? "玉" : game.currentAttack.card.type;
        line2 = `攻め手: ${cardName}`;
        infoEl.style.color = isMyTurn ? "#f1c40f" : "#ffffff";
      } else {
        line2 = `親 (攻め)`;
        infoEl.style.color = isMyTurn ? "#00ff00" : "#ffffff";
      }

      infoEl.innerText = `${line1}\n${line2}`;
    }

    this.updateControls(game);
    this.updateNameTags(); // Ensure names are updated with "YOU" label
  }

  updateControls(game) {
    const btnAction = document.getElementById('btn-action');
    if (!btnAction) return;

    const isMyTurn = (game.turnPlayerIndex === this.localPlayerIndex && !game.gameOver);

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

    const isMe = (player.id === this.localPlayerIndex);

    player.hand.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      // Only show face if it's ME
      if (!isMe) {
        cardEl.classList.add('hidden');
      } else {
        cardEl.textContent = card.isJewel ? "玉" : card.type;
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
    if (game.turnPlayerIndex !== this.localPlayerIndex) return;
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
      c1.textContent = card1.isJewel ? "玉" : card1.type;
    }

    // Card 2 -> Attack Row
    const c2 = document.createElement('div');
    c2.className = 'card small';
    c2.textContent = card2.isJewel ? "玉" : card2.type;

    rowRec.appendChild(c1);
    rowAtt.appendChild(c2);

    // Bubbles
    const actionName = isLead ? "攻" : "受・攻";
    const cardName = card2.isJewel ? "玉" : card2.type;
    this.showBubble(playerId, `${actionName}: ${cardName}`);
  }

  showBubble(playerId, text) {
    const bubble = this.container.querySelector(`#player-${playerId} .status-bubble`);
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 2000);
    }
  }

  revealLastLead(playerId, card) {
    const pArea = this.container.querySelector(`#player-${playerId}`);
    if (!pArea) return;

    const rowRec = pArea.querySelector('.row-receive');
    const hiddenCard = rowRec.querySelector('.lead-hidden');

    if (hiddenCard) {
      hiddenCard.classList.remove('hidden');
      hiddenCard.classList.remove('lead-hidden');
      hiddenCard.textContent = card.isJewel ? "玉" : card.type;
      hiddenCard.style.color = "#f1c40f"; // Highlight revealed card
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
    this.logNetwork(msg); // Also log to network panel
  }

  logNetwork(msg) {
    const el = document.getElementById('network-log');
    if (el) {
      const line = document.createElement('div');
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      line.style.borderBottom = "1px solid #333";
      el.appendChild(line);
      el.scrollTop = el.scrollHeight;
    }
    console.log("[NET]", msg);
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
        if (nameTag) {
          let name = this.playerNames[i] || `Player ${i}`;
          if (i === this.localPlayerIndex) {
            name += " (あなた)";
            nameTag.classList.add('is-me');
            nameTag.style.color = "#f1c40f";
            nameTag.style.fontWeight = "bold";
            nameTag.style.border = "2px solid #f1c40f";
            nameTag.style.padding = "2px 8px";
            nameTag.style.borderRadius = "10px";
          } else {
            nameTag.classList.remove('is-me');
            nameTag.style.color = "";
            nameTag.style.fontWeight = "";
            nameTag.style.border = "";
          }
          nameTag.textContent = name;
        }

        // Also update score board name for Player 0
        if (i === 0) {
          const scoreName = document.getElementById('name-0-score');
          if (scoreName) scoreName.textContent = this.playerNames[0];
        }
      }
    }
  }

  createSettingsUI() {
    // Settings Button
    const btnSettings = document.createElement('button');
    btnSettings.id = 'btn-settings';
    btnSettings.textContent = '⚙️ 設定';
    btnSettings.className = 'settings-button';
    btnSettings.onclick = () => {
      const modal = document.getElementById('settings-modal');
      modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
    };
    this.container.appendChild(btnSettings);

    // Settings Modal
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'settings-modal';
    modal.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'settings-content';

    // 1. Room ID
    if (this.network.currentRoomId) {
      const roomRow = document.createElement('div');
      roomRow.className = 'settings-row';
      roomRow.innerHTML = `
              <span>ルームID: <strong>${this.network.currentRoomId}</strong></span>
              <button id="btn-copy-id" style="margin-left:10px;">コピー</button>
          `;
      content.appendChild(roomRow);

      setTimeout(() => {
        const btnCopy = document.getElementById('btn-copy-id');
        if (btnCopy) {
          btnCopy.onclick = () => {
            navigator.clipboard.writeText(this.network.currentRoomId);
            btnCopy.textContent = "コピーしました";
            setTimeout(() => btnCopy.textContent = "コピー", 2000);
          };
        }
      }, 0);
    }

    // 2. Network Log Toggle
    const logRow = document.createElement('div');
    logRow.className = 'settings-row';
    logRow.innerHTML = `
            <span>ネットワークログ表示</span>
            <button id="btn-toggle-log">表示</button>
        `;
    content.appendChild(logRow);

    setTimeout(() => {
      const btnLog = document.getElementById('btn-toggle-log');
      if (btnLog) {
        btnLog.onclick = () => {
          const netLog = document.getElementById('network-log');
          if (netLog) {
            netLog.style.display = (netLog.style.display === 'none') ? 'block' : 'none';
            btnLog.textContent = (netLog.style.display === 'none') ? '表示' : '非表示';
          }
        };
      }
    }, 0);

    modal.appendChild(content);
    this.container.appendChild(modal);
  }
}
