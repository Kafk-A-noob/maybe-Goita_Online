(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const qr="modulepreload",Kr=function(n,e){return new URL(n,e).href},ms={},Yr=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){let o=function(u){return Promise.all(u.map(h=>Promise.resolve(h).then(d=>({status:"fulfilled",value:d}),d=>({status:"rejected",reason:d}))))};const a=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));i=o(t.map(u=>{if(u=Kr(u,s),u in ms)return;ms[u]=!0;const h=u.endsWith(".css"),d=h?'[rel="stylesheet"]':"";if(!!s)for(let C=a.length-1;C>=0;C--){const T=a[C];if(T.href===u&&(!h||T.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${d}`))return;const m=document.createElement("link");if(m.rel=h?"stylesheet":qr,h||(m.as="script"),m.crossOrigin="",m.href=u,c&&m.setAttribute("nonce",c),document.head.appendChild(m),h)return new Promise((C,T)=>{m.addEventListener("load",C),m.addEventListener("error",()=>T(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return i.then(o=>{for(const a of o||[])a.status==="rejected"&&r(a.reason);return e().catch(r)})},R={KING:"王",rook:"飛",bishop:"角",gold:"金",silver:"銀",knight:"馬",lance:"香",pawn:"し"},Qr={[R.KING]:2,[R.rook]:2,[R.bishop]:2,[R.gold]:4,[R.silver]:4,[R.knight]:4,[R.lance]:4,[R.pawn]:10},Jr=[0,1,2,3];class te{constructor(e,t){this.type=e,this.id=t,this.faceUp=!1,this.isJewel=!1}flip(){this.faceUp=!this.faceUp}}class Xr{constructor(e,t=!1){this.id=e,this.isHuman=t,this.hand=[],this.team=e%2}setHand(e){this.hand=e}removeCard(e){this.hand=this.hand.filter(t=>t.id!==e.id)}hasCard(e){return this.hand.some(t=>t.type===e)}decideAction(e){return this.isHuman?null:new Promise(t=>{setTimeout(()=>{t(this._aiLogic(e))},1e3)})}_aiLogic(e){const{currentAttack:t}=e;if(t){const s=t.card.type,i=this.hand.filter(r=>r.type===s||r.type===R.KING&&s!==R.pawn&&s!==R.lance);if(i.length>0){const r=i[0],o=this.hand.filter(a=>a.id!==r.id);if(o.length>0){const a=Math.floor(Math.random()*o.length);return{action:"playTurn",card1:r,card2:o[a]}}}return{action:"pass"}}else if(this.hand.length>=2){const s=Math.floor(Math.random()*this.hand.length);let i=Math.floor(Math.random()*this.hand.length);for(;s===i;)i=Math.floor(Math.random()*this.hand.length);return{action:"playTurn",card1:this.hand[s],card2:this.hand[i]}}else return{action:"pass"}}}class Zr{constructor(e){this.renderer=e,this.network=e.network,this.players=Jr.map(t=>new Xr(t,t===0)),this.deck=[],this.turnPlayerIndex=0,this.currentAttack=null,this.passCount=0,this.gameOver=!1,this.teamScores=[0,0],this.roundCount=1,this.visibleKingCount=0,this.isNetworkGame=!1,this.localPlayerIndex=-1,this.isSubscribedToActions=!1,this.network&&(this.network.onGameStart=()=>this.startNetworkGame())}start(){this.isNetworkGame=!1,this.initDeck(),this.deal(),this.renderer.render(this),this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (シングル) ===`),this.nextTurn()}async startNetworkGame(){this.isNetworkGame=!0;const{get:e,ref:t}=await Yr(async()=>{const{get:r,ref:o}=await Promise.resolve().then(()=>Qh);return{get:r,ref:o}},void 0,import.meta.url),i=(await e(t(this.network.db,`rooms/${this.network.currentRoomId}`))).val();if(this.renderer.setupGameUI(),i.status==="playing"){this.renderer.log("進行中のゲームに再接続しています...");const r=await this.network.getGameState(),o=await this.network.getGameActions();if(r){await this.restoreState(r,o);return}}if(this.network.isHost){const r=i.players;this.setupPlayersFromNetwork(r),this.initDeck(),this.deal();const o=this.players.map(a=>a.hand.map(l=>({type:l.type,id:l.id})));this.network.setInitialState({hands:o,turn:0,round:this.roundCount,players:r}),this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ホスト) ===`),this.renderer.render(this),this.isSubscribedToActions||(this.network.subscribeToGameActions(a=>this.handleRemoteAction(a)),this.isSubscribedToActions=!0),this.nextTurn()}else this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (マルチ:ゲスト) ===`),this.renderer.log("ホストの準備を待っています..."),this.network.subscribeToInitialState(r=>{r.round===this.roundCount&&(r.players&&this.setupPlayersFromNetwork(r.players),this.players.forEach((o,a)=>{const l=r.hands[a];o.setHand(l.map(c=>new te(c.type,c.id)))}),this.turnPlayerIndex=r.turn,this.renderer.render(this),this.isSubscribedToActions||(this.network.subscribeToGameActions(o=>this.handleRemoteAction(o)),this.isSubscribedToActions=!0),this.nextTurn())})}async restoreState(e,t){if(e.players&&this.setupPlayersFromNetwork(e.players),this.players.forEach((s,i)=>{const r=e.hands[i];s.setHand(r.map(o=>new te(o.type,o.id)))}),this.turnPlayerIndex=e.turn,this.roundCount=e.round,this.renderer.log(`状態復元: ラウンド ${this.roundCount}, 手番 P${this.turnPlayerIndex}`),t&&t.length>0){this.renderer.log(`過去のアクションをリプレイ中 (${t.length}件)...`);for(const s of t){const i=this.players[s.playerIndex];if(s.card1){const r=new te(s.card1.type,s.card1.id);r.isJewel=s.card1.isJewel,s.card1=r}if(s.card2){const r=new te(s.card2.type,s.card2.id);r.isJewel=s.card2.isJewel,s.card2=r}await this.executeActionLogic(i,s)}}this.renderer.render(this),this.nextTurn()}setupPlayersFromNetwork(e){console.log("Setting up players from network...",e),Object.values(e).forEach(t=>{const s=t.index,i=this.players[s];i.isHuman=!t.isCpu,i.name=t.name,this.renderer.playerNames&&(this.renderer.playerNames[s]=t.name),t.id===this.network.playerId&&(console.log(`Identified myself as Player ${s}`),this.renderer.log(`ID一致: プレイヤー ${s} として参加`),this.localPlayerIndex=s,i.isHuman=!0)}),this.network.isHost&&(this.localPlayerIndex=0,console.log("I am Host (Player 0)")),this.localPlayerIndex===-1&&this.renderer.log("エラー: プレイヤーIDが見つかりません (観戦モード)"),this.renderer.setLocalPlayer(this.localPlayerIndex),this.renderer.updateNameTags()}async nextRound(e){if(this.roundCount++,this.gameOver=!1,this.turnPlayerIndex=e,this.currentAttack=null,this.passCount=0,this.visibleKingCount=0,this.renderer.clearField(),!this.isNetworkGame)this.initDeck(),this.deal(),this.renderer.render(this),this.renderer.log(`=== ラウンド ${this.roundCount} 開始 ===`),this.nextTurn();else if(this.renderer.log("次のラウンドの準備中..."),await this.network.setReadyForNextRound(!0),this.network.isHost){this.renderer.log("全員の準備完了を待っています..."),await this.network.waitForAllPlayersReady(),await this.network.resetAllPlayersReady(),this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (ホスト) ===`),this.initDeck(),this.deal();const t=this.players.map(s=>s.hand.map(i=>({type:i.type,id:i.id})));this.network.setInitialState({hands:t,turn:this.turnPlayerIndex,round:this.roundCount,players:null}),this.renderer.render(this),this.nextTurn()}else{this.renderer.log("ホストの開始を待っています...");const t=this.roundCount;this.network.subscribeToInitialState(s=>{s.round===t&&(this.players.forEach((i,r)=>{const o=s.hands[r];i.setHand(o.map(a=>new te(a.type,a.id)))}),this.turnPlayerIndex=s.turn,this.renderer.log(`=== ラウンド ${this.roundCount} 開始 (ゲスト) ===`),this.renderer.render(this),this.nextTurn())})}}initDeck(){this.deck=[];let e=0;for(const[t,s]of Object.entries(Qr))for(let i=0;i<s;i++){const r=new te(t,e++);t===R.KING&&i===1&&(r.isJewel=!0),this.deck.push(r)}for(let t=this.deck.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[this.deck[t],this.deck[s]]=[this.deck[s],this.deck[t]]}}deal(){for(let t=0;t<4;t++){const s=this.deck.splice(0,8);this.players[t].setHand(s)}this.checkHandConditions()}checkHandConditions(){if(this.isNetworkGame&&!this.network.isHost)return;let e={},t=[];this.players.forEach(r=>{const o=r.hand.filter(a=>a.type===R.pawn).length;if(e[r.id]=o,o===8)t.push({type:"8shi",playerId:r.id,score:100});else if(o===7){const a=r.hand.find(c=>c.type!==R.pawn),l=(SCORES[a.type]||10)*2;t.push({type:"7shi",playerId:r.id,score:l})}else if(o===6){const a=r.hand.filter(c=>c.type!==R.pawn);let l=0;a[0].type===a[1].type?l=(SCORES[a[0].type]||10)*2:l=Math.max(SCORES[a[0].type]||0,SCORES[a[1].type]||0),t.push({type:"6shi",playerId:r.id,score:l})}else o===5&&t.push({type:"5shi",playerId:r.id})}),e[0]===5&&e[2]===5&&t.push({type:"team5shi",team:0,score:150}),e[1]===5&&e[3]===5&&t.push({type:"team5shi",team:1,score:150});const s=t.find(r=>["team5shi","8shi","7shi","6shi"].includes(r.type));if(s){this.handleSpecialWin(s);return}const i=t.filter(r=>r.type==="5shi");i.length>0&&this.handleFiveShiScenarios(i)}handleSpecialWin(e){this.renderer.log(`特殊勝利条件: ${e.type}`),setTimeout(()=>{let t=e.playerId;e.type==="team5shi"&&(t=e.team),this.teamScores[t%2]+=e.score,this.renderer.updateScores(this.teamScores),this.gameOver=!0,this.renderer.showRoundResult(t,e.score,this.teamScores.some(s=>s>=150)),this.isNetworkGame&&this.network.sendSpecialWin(e)},1e3)}handleFiveShiScenarios(e){const t=e.map(r=>r.playerId);this.renderer.log(`五し: プレイヤー ${t.join(", ")}`);const s=t.filter(r=>r%2===0).length,i=t.filter(r=>r%2===1).length;s>0&&i>0?this.handleEnemyAllyFiveShi(e):this.handleSingleFiveShi(e[0])}handleSingleFiveShi(e){const t=e.playerId,s=(t+2)%4;this.renderer.log(`プレイヤー ${t} が「五し」。相方(P${s})が判断します。`),this.isNetworkGame?this.network.sendFiveShiEvent({...e,partnerId:s}):s===0?this.renderer.showFiveShiDialog(()=>this.redeal(),()=>this.renderer.log("続行します。")):(this.renderer.log(`CPU (P${s}) が配り直しを選択しました。`),setTimeout(()=>this.redeal(),1e3))}handleEnemyAllyFiveShi(e){this.renderer.log("敵・味方それぞれ一人が「五し」です。両相方が配り直しを選択した場合のみ配り直します。"),this.pendingFiveShiDecisions={players:e.map(t=>t.playerId),decisions:{}},e.forEach(t=>{const i=(t.playerId+2)%4;this.isNetworkGame?this.network.sendFiveShiEvent({...t,partnerId:i,isEnemyAllyScenario:!0}):i===0?this.renderer.showFiveShiDialog(()=>this.recordFiveShiDecision(i,!0),()=>this.recordFiveShiDecision(i,!1)):setTimeout(()=>this.recordFiveShiDecision(i,!0),1e3)})}recordFiveShiDecision(e,t){if(!this.pendingFiveShiDecisions)return;if(this.pendingFiveShiDecisions.decisions[e]=t,this.renderer.log(`P${e} が ${t?"配り直し":"続行"} を選択。`),this.pendingFiveShiDecisions.players.every(i=>{const r=(i+2)%4;return this.pendingFiveShiDecisions.decisions[r]!==void 0})){const i=Object.values(this.pendingFiveShiDecisions.decisions).every(r=>r===!0);this.pendingFiveShiDecisions=null,i?(this.renderer.log("両相方が配り直しを選択しました。配り直します。"),setTimeout(()=>this.redeal(),1e3)):(this.renderer.log("片方が続行を選択しました。ゲームを続行します。"),this.nextTurn())}}redeal(){this.renderer.log("配り直し..."),this.renderer.clearField(),this.initDeck(),this.deal(),this.renderer.render(this),this.nextTurn()}async nextTurn(){if(this.gameOver)return;const e=this.players[this.turnPlayerIndex];if(this.renderer.highlightPlayer(this.turnPlayerIndex),this.isNetworkGame){const s=this.network.isHost,i=this.turnPlayerIndex===this.localPlayerIndex,r=!e.isHuman;if(!(s&&r)){if(!i)return}}const t=await e.decideAction({currentAttack:this.currentAttack,history:[]});if(!t&&e.isHuman){this.renderer.enableControls(!0,this.currentAttack);return}t&&this.processAction(e,t)}async handleHumanAction(e){const t=this.players[this.turnPlayerIndex];if(this.isNetworkGame&&this.turnPlayerIndex!==this.localPlayerIndex)return;const s=await this.processAction(t,e);if(!s.valid){alert(s.reason);return}this.renderer.enableControls(!1)}async processAction(e,t){const s=await this.executeActionLogic(e,t);if(this.isNetworkGame){const i={...t,playerIndex:e.id};i.card1&&(i.card1={type:i.card1.type,id:i.card1.id,isJewel:i.card1.isJewel}),i.card2&&(i.card2={type:i.card2.type,id:i.card2.id,isJewel:i.card2.isJewel}),this.renderer.logNetwork(`Sending Action: P${e.id} ${t.action}`),this.network.sendGameAction(i)}return s}async handleRemoteAction(e){if(this.renderer.logNetwork(`Received Action: P${e.playerIndex} ${e.action}`),e.playerIndex===this.localPlayerIndex){this.renderer.logNetwork(`IGNORED (Self Index: ${this.localPlayerIndex})`);return}if(e.playerId===this.network.playerId){this.renderer.logNetwork("IGNORED (Self ID)");return}const t=this.players[e.playerIndex];if(e.card1){const s=new te(e.card1.type,e.card1.id);s.isJewel=e.card1.isJewel,e.card1=s}if(e.card2){const s=new te(e.card2.type,e.card2.id);s.isJewel=e.card2.isJewel,e.card2=s}this.renderer.log(`Remote Action from P${t.id}`),await this.executeActionLogic(t,e)}async executeActionLogic(e,t){if(t.action==="pass"){if(!this.currentAttack)return{valid:!1,reason:"攻めの手番ではパスできません"};if(this.passCount++,this.renderer.log(`プレイヤー ${e.id}: なし`),this.passCount>=3){const s=this.currentAttack.playerIndex;this.finishTrick(s)}else this.turnPlayerIndex=(this.turnPlayerIndex+1)%4,this.nextTurn();return{valid:!0}}if(t.action==="playTurn"){const{card1:s,card2:i}=t;if(!s||!i)return{valid:!1,reason:"カードを2枚選んでください"};if(i.type===R.KING&&e.hand.filter(o=>o.type===R.KING).length+this.visibleKingCount<2)return{valid:!1,reason:"王(玉)で攻めるには、もう一枚の王(玉)が必要です (手札または場)"};if(this.currentAttack){const r=this.currentAttack.card.type,o=s.type;let a=r===o;if(!a&&o===R.KING&&r!==R.pawn&&r!==R.lance&&(a=!0),!a)return{valid:!1,reason:"そのカードでは受けられません"};e.removeCard(s),e.removeCard(i);const l=s.isJewel?"玉":s.type,c=i.isJewel?"玉":i.type;this.renderer.log(`プレイヤー ${e.id} 受け・攻め: ${l} -> ${c}`),this.renderer.showPlay(e.id,s,i,!1),s.type===R.KING&&this.visibleKingCount++,i.type===R.KING&&this.visibleKingCount++,this.currentAttack={playerIndex:e.id,card:i},this.passCount=0,this.renderer.render(this);const u=s.type===i.type,h=await this.checkWin(e,u);return!this.gameOver&&!h&&(this.turnPlayerIndex=(this.turnPlayerIndex+1)%4,this.nextTurn()),{valid:!0}}else{e.removeCard(s),e.removeCard(i);const r=i.isJewel?"玉":i.type;this.renderer.log(`プレイヤー ${e.id} 攻め: [伏せ] -> ${r}`),this.renderer.showPlay(e.id,s,i,!0),i.type===R.KING&&this.visibleKingCount++,this.currentAttack={playerIndex:e.id,card:i},this.passCount=0,this.renderer.render(this);const o=s.type===i.type;o&&this.renderer.revealLastLead(e.id,s);const a=await this.checkWin(e,o);return!this.gameOver&&!a&&(this.turnPlayerIndex=(this.turnPlayerIndex+1)%4,this.nextTurn()),{valid:!0}}}}finishTrick(e){this.renderer.log(`全員パス。プレイヤー ${e} が再攻撃します。`),this.currentAttack=null,this.passCount=0,this.turnPlayerIndex=e,this.renderer.render(this),this.nextTurn()}async checkWin(e,t=!1){if(e.hand.length===0){let s=30;return this.currentAttack&&this.currentAttack.playerIndex===e.id&&(s={王:50,飛:40,角:40,金:30,銀:30,馬:20,香:20,し:10}[this.currentAttack.card.type]||30),t&&(s*=2,this.renderer.log("ダブル得点！ (同種受け攻め)")),this.teamScores[e.id%2]+=s,this.renderer.updateScores(this.teamScores),this.renderer.log(`ラウンド終了！ 勝者: プレイヤー ${e.id} (+${s})`),this.teamScores.some(i=>i>=150)?(this.gameOver=!0,this.renderer.showRoundResult(e.id,s,!0)):this.renderer.showRoundResult(e.id,s,!1),!0}return!1}}const eo=()=>{};var _s={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const li={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const f=function(n,e){if(!n)throw $e(e)},$e=function(n){return new Error("Firebase Database ("+li.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ci=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},to=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const i=n[t++];if(i<128)e[s++]=String.fromCharCode(i);else if(i>191&&i<224){const r=n[t++];e[s++]=String.fromCharCode((i&31)<<6|r&63)}else if(i>239&&i<365){const r=n[t++],o=n[t++],a=n[t++],l=((i&7)<<18|(r&63)<<12|(o&63)<<6|a&63)-65536;e[s++]=String.fromCharCode(55296+(l>>10)),e[s++]=String.fromCharCode(56320+(l&1023))}else{const r=n[t++],o=n[t++];e[s++]=String.fromCharCode((i&15)<<12|(r&63)<<6|o&63)}}return e.join("")},On={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let i=0;i<n.length;i+=3){const r=n[i],o=i+1<n.length,a=o?n[i+1]:0,l=i+2<n.length,c=l?n[i+2]:0,u=r>>2,h=(r&3)<<4|a>>4;let d=(a&15)<<2|c>>6,p=c&63;l||(p=64,o||(d=64)),s.push(t[u],t[h],t[d],t[p])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(ci(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):to(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let i=0;i<n.length;){const r=t[n.charAt(i++)],a=i<n.length?t[n.charAt(i)]:0;++i;const c=i<n.length?t[n.charAt(i)]:64;++i;const h=i<n.length?t[n.charAt(i)]:64;if(++i,r==null||a==null||c==null||h==null)throw new no;const d=r<<2|a>>4;if(s.push(d),c!==64){const p=a<<4&240|c>>2;if(s.push(p),h!==64){const m=c<<6&192|h;s.push(m)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class no extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const hi=function(n){const e=ci(n);return On.encodeByteArray(e,!0)},Ct=function(n){return hi(n).replace(/\./g,"")},fn=function(n){try{return On.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function so(n){return di(void 0,n)}function di(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!io(t)||(n[t]=di(n[t],e[t]));return n}function io(n){return n!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ro(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oo=()=>ro().__FIREBASE_DEFAULTS__,ao=()=>{if(typeof process>"u"||typeof _s>"u")return;const n=_s.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},lo=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&fn(n[1]);return e&&JSON.parse(e)},ui=()=>{try{return eo()||oo()||ao()||lo()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},co=n=>{var e,t;return(t=(e=ui())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},ho=n=>{const e=co(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},fi=()=>{var n;return(n=ui())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mn(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function uo(n){return(await fetch(n,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fo(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",i=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${s}`,aud:s,iat:i,exp:i+3600,auth_time:i,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Ct(JSON.stringify(t)),Ct(JSON.stringify(o)),""].join(".")}const Ke={};function po(){const n={prod:[],emulator:[]};for(const e of Object.keys(Ke))Ke[e]?n.emulator.push(e):n.prod.push(e);return n}function mo(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let gs=!1;function _o(n,e){if(typeof window>"u"||typeof document>"u"||!Mn(window.location.host)||Ke[n]===e||Ke[n]||gs)return;Ke[n]=e;function t(d){return`__firebase__banner__${d}`}const s="__firebase__banner",r=po().prod.length>0;function o(){const d=document.getElementById(s);d&&d.remove()}function a(d){d.style.display="flex",d.style.background="#7faaf0",d.style.position="fixed",d.style.bottom="5px",d.style.left="5px",d.style.padding=".5em",d.style.borderRadius="5px",d.style.alignItems="center"}function l(d,p){d.setAttribute("width","24"),d.setAttribute("id",p),d.setAttribute("height","24"),d.setAttribute("viewBox","0 0 24 24"),d.setAttribute("fill","none"),d.style.marginLeft="-6px"}function c(){const d=document.createElement("span");return d.style.cursor="pointer",d.style.marginLeft="16px",d.style.fontSize="24px",d.innerHTML=" &times;",d.onclick=()=>{gs=!0,o()},d}function u(d,p){d.setAttribute("id",p),d.innerText="Learn more",d.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",d.setAttribute("target","__blank"),d.style.paddingLeft="5px",d.style.textDecoration="underline"}function h(){const d=mo(s),p=t("text"),m=document.getElementById(p)||document.createElement("span"),C=t("learnmore"),T=document.getElementById(C)||document.createElement("a"),Y=t("preprendIcon"),Q=document.getElementById(Y)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(d.created){const pe=d.element;a(pe),u(T,C);const en=c();l(Q,Y),pe.append(Q,m,T,en),document.body.appendChild(pe)}r?(m.innerText="Preview backend disconnected.",Q.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(Q.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,m.innerText="Preview backend running in this workspace."),m.setAttribute("id",p)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",h):h()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function go(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function pi(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(go())}function yo(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function vo(){return li.NODE_ADMIN===!0}function Co(){try{return typeof indexedDB=="object"}catch{return!1}}function bo(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(s);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var r;e(((r=i.error)==null?void 0:r.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wo="FirebaseError";class ht extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=wo,Object.setPrototypeOf(this,ht.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,mi.prototype.create)}}class mi{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},i=`${this.service}/${e}`,r=this.errors[e],o=r?Io(r,s):"Error",a=`${this.serviceName}: ${o} (${i}).`;return new ht(i,a,s)}}function Io(n,e){return n.replace(Eo,(t,s)=>{const i=e[s];return i!=null?String(i):`<${s}?>`})}const Eo=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function et(n){return JSON.parse(n)}function P(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _i=function(n){let e={},t={},s={},i="";try{const r=n.split(".");e=et(fn(r[0])||""),t=et(fn(r[1])||""),i=r[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:i}},So=function(n){const e=_i(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},To=function(n){const e=_i(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function K(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function Pe(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function pn(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function bt(n,e,t){const s={};for(const i in n)Object.prototype.hasOwnProperty.call(n,i)&&(s[i]=e.call(t,n[i],i,n));return s}function wt(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const i of t){if(!s.includes(i))return!1;const r=n[i],o=e[i];if(ys(r)&&ys(o)){if(!wt(r,o))return!1}else if(r!==o)return!1}for(const i of s)if(!t.includes(i))return!1;return!0}function ys(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xo(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ro{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let h=0;h<16;h++)s[h]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let h=0;h<16;h++)s[h]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let h=16;h<80;h++){const d=s[h-3]^s[h-8]^s[h-14]^s[h-16];s[h]=(d<<1|d>>>31)&4294967295}let i=this.chain_[0],r=this.chain_[1],o=this.chain_[2],a=this.chain_[3],l=this.chain_[4],c,u;for(let h=0;h<80;h++){h<40?h<20?(c=a^r&(o^a),u=1518500249):(c=r^o^a,u=1859775393):h<60?(c=r&o|a&(r|o),u=2400959708):(c=r^o^a,u=3395469782);const d=(i<<5|i>>>27)+c+l+u+s[h]&4294967295;l=a,a=o,o=(r<<30|r>>>2)&4294967295,r=i,i=d}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let i=0;const r=this.buf_;let o=this.inbuf_;for(;i<t;){if(o===0)for(;i<=s;)this.compress_(e,i),i+=this.blockSize;if(typeof e=="string"){for(;i<t;)if(r[o]=e.charCodeAt(i),++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}else for(;i<t;)if(r[o]=e[i],++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let i=this.blockSize-1;i>=56;i--)this.buf_[i]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let i=0;i<5;i++)for(let r=24;r>=0;r-=8)e[s]=this.chain_[i]>>r&255,++s;return e}}function De(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ko=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);if(i>=55296&&i<=56319){const r=i-55296;s++,f(s<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(s)-56320;i=65536+(r<<10)+o}i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):i<65536?(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},$t=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fe(n){return n&&n._delegate?n._delegate:n}class tt{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const me="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class No{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new j;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&s.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(i){if(s)return null;throw i}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Po(e))try{this.getOrInitializeService({instanceIdentifier:me})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const r=this.getOrInitializeService({instanceIdentifier:i});s.resolve(r)}catch{}}}}clearInstance(e=me){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=me){return this.instances.has(e)}getOptions(e=me){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[r,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(r);s===a&&o.resolve(i)}return i}onInit(e,t){const s=this.normalizeInstanceIdentifier(t),i=this.onInitCallbacks.get(s)??new Set;i.add(e),this.onInitCallbacks.set(s,i);const r=this.instances.get(s);return r&&e(r,s),()=>{i.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const i of s)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Ao(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=me){return this.component?this.component.multipleInstances?e:me:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Ao(n){return n===me?void 0:n}function Po(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Do{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new No(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var S;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(S||(S={}));const Oo={debug:S.DEBUG,verbose:S.VERBOSE,info:S.INFO,warn:S.WARN,error:S.ERROR,silent:S.SILENT},Mo=S.INFO,Lo={[S.DEBUG]:"log",[S.VERBOSE]:"log",[S.INFO]:"info",[S.WARN]:"warn",[S.ERROR]:"error"},Fo=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),i=Lo[e];if(i)console[i](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class gi{constructor(e){this.name=e,this._logLevel=Mo,this._logHandler=Fo,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in S))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Oo[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,S.DEBUG,...e),this._logHandler(this,S.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,S.VERBOSE,...e),this._logHandler(this,S.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,S.INFO,...e),this._logHandler(this,S.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,S.WARN,...e),this._logHandler(this,S.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,S.ERROR,...e),this._logHandler(this,S.ERROR,...e)}}const Bo=(n,e)=>e.some(t=>n instanceof t);let vs,Cs;function $o(){return vs||(vs=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Ho(){return Cs||(Cs=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const yi=new WeakMap,mn=new WeakMap,vi=new WeakMap,tn=new WeakMap,Ln=new WeakMap;function Wo(n){const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("success",r),n.removeEventListener("error",o)},r=()=>{t(re(n.result)),i()},o=()=>{s(n.error),i()};n.addEventListener("success",r),n.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&yi.set(t,n)}).catch(()=>{}),Ln.set(e,n),e}function Uo(n){if(mn.has(n))return;const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("complete",r),n.removeEventListener("error",o),n.removeEventListener("abort",o)},r=()=>{t(),i()},o=()=>{s(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",r),n.addEventListener("error",o),n.addEventListener("abort",o)});mn.set(n,e)}let _n={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return mn.get(n);if(e==="objectStoreNames")return n.objectStoreNames||vi.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return re(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function Go(n){_n=n(_n)}function Vo(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const s=n.call(nn(this),e,...t);return vi.set(s,e.sort?e.sort():[e]),re(s)}:Ho().includes(n)?function(...e){return n.apply(nn(this),e),re(yi.get(this))}:function(...e){return re(n.apply(nn(this),e))}}function zo(n){return typeof n=="function"?Vo(n):(n instanceof IDBTransaction&&Uo(n),Bo(n,$o())?new Proxy(n,_n):n)}function re(n){if(n instanceof IDBRequest)return Wo(n);if(tn.has(n))return tn.get(n);const e=zo(n);return e!==n&&(tn.set(n,e),Ln.set(e,n)),e}const nn=n=>Ln.get(n);function jo(n,e,{blocked:t,upgrade:s,blocking:i,terminated:r}={}){const o=indexedDB.open(n,e),a=re(o);return s&&o.addEventListener("upgradeneeded",l=>{s(re(o.result),l.oldVersion,l.newVersion,re(o.transaction),l)}),t&&o.addEventListener("blocked",l=>t(l.oldVersion,l.newVersion,l)),a.then(l=>{r&&l.addEventListener("close",()=>r()),i&&l.addEventListener("versionchange",c=>i(c.oldVersion,c.newVersion,c))}).catch(()=>{}),a}const qo=["get","getKey","getAll","getAllKeys","count"],Ko=["put","add","delete","clear"],sn=new Map;function bs(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(sn.get(e))return sn.get(e);const t=e.replace(/FromIndex$/,""),s=e!==t,i=Ko.includes(t);if(!(t in(s?IDBIndex:IDBObjectStore).prototype)||!(i||qo.includes(t)))return;const r=async function(o,...a){const l=this.transaction(o,i?"readwrite":"readonly");let c=l.store;return s&&(c=c.index(a.shift())),(await Promise.all([c[t](...a),i&&l.done]))[0]};return sn.set(e,r),r}Go(n=>({...n,get:(e,t,s)=>bs(e,t)||n.get(e,t,s),has:(e,t)=>!!bs(e,t)||n.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yo{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Qo(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function Qo(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const gn="@firebase/app",ws="0.14.6";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Z=new gi("@firebase/app"),Jo="@firebase/app-compat",Xo="@firebase/analytics-compat",Zo="@firebase/analytics",ea="@firebase/app-check-compat",ta="@firebase/app-check",na="@firebase/auth",sa="@firebase/auth-compat",ia="@firebase/database",ra="@firebase/data-connect",oa="@firebase/database-compat",aa="@firebase/functions",la="@firebase/functions-compat",ca="@firebase/installations",ha="@firebase/installations-compat",da="@firebase/messaging",ua="@firebase/messaging-compat",fa="@firebase/performance",pa="@firebase/performance-compat",ma="@firebase/remote-config",_a="@firebase/remote-config-compat",ga="@firebase/storage",ya="@firebase/storage-compat",va="@firebase/firestore",Ca="@firebase/ai",ba="@firebase/firestore-compat",wa="firebase",Ia="12.6.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yn="[DEFAULT]",Ea={[gn]:"fire-core",[Jo]:"fire-core-compat",[Zo]:"fire-analytics",[Xo]:"fire-analytics-compat",[ta]:"fire-app-check",[ea]:"fire-app-check-compat",[na]:"fire-auth",[sa]:"fire-auth-compat",[ia]:"fire-rtdb",[ra]:"fire-data-connect",[oa]:"fire-rtdb-compat",[aa]:"fire-fn",[la]:"fire-fn-compat",[ca]:"fire-iid",[ha]:"fire-iid-compat",[da]:"fire-fcm",[ua]:"fire-fcm-compat",[fa]:"fire-perf",[pa]:"fire-perf-compat",[ma]:"fire-rc",[_a]:"fire-rc-compat",[ga]:"fire-gcs",[ya]:"fire-gcs-compat",[va]:"fire-fst",[ba]:"fire-fst-compat",[Ca]:"fire-vertex","fire-js":"fire-js",[wa]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const It=new Map,Sa=new Map,vn=new Map;function Is(n,e){try{n.container.addComponent(e)}catch(t){Z.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Et(n){const e=n.name;if(vn.has(e))return Z.debug(`There were multiple attempts to register component ${e}.`),!1;vn.set(e,n);for(const t of It.values())Is(t,n);for(const t of Sa.values())Is(t,n);return!0}function Ta(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function xa(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ra={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},oe=new mi("app","Firebase",Ra);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ka{constructor(e,t,s){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new tt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw oe.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Na=Ia;function Ci(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s={name:yn,automaticDataCollectionEnabled:!0,...e},i=s.name;if(typeof i!="string"||!i)throw oe.create("bad-app-name",{appName:String(i)});if(t||(t=fi()),!t)throw oe.create("no-options");const r=It.get(i);if(r){if(wt(t,r.options)&&wt(s,r.config))return r;throw oe.create("duplicate-app",{appName:i})}const o=new Do(i);for(const l of vn.values())o.addComponent(l);const a=new ka(t,s,o);return It.set(i,a),a}function Aa(n=yn){const e=It.get(n);if(!e&&n===yn&&fi())return Ci();if(!e)throw oe.create("no-app",{appName:n});return e}function ke(n,e,t){let s=Ea[n]??n;t&&(s+=`-${t}`);const i=s.match(/\s|\//),r=e.match(/\s|\//);if(i||r){const o=[`Unable to register library "${s}" with version "${e}":`];i&&o.push(`library name "${s}" contains illegal characters (whitespace or "/")`),i&&r&&o.push("and"),r&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Z.warn(o.join(" "));return}Et(new tt(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pa="firebase-heartbeat-database",Da=1,nt="firebase-heartbeat-store";let rn=null;function bi(){return rn||(rn=jo(Pa,Da,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(nt)}catch(t){console.warn(t)}}}}).catch(n=>{throw oe.create("idb-open",{originalErrorMessage:n.message})})),rn}async function Oa(n){try{const t=(await bi()).transaction(nt),s=await t.objectStore(nt).get(wi(n));return await t.done,s}catch(e){if(e instanceof ht)Z.warn(e.message);else{const t=oe.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Z.warn(t.message)}}}async function Es(n,e){try{const s=(await bi()).transaction(nt,"readwrite");await s.objectStore(nt).put(e,wi(n)),await s.done}catch(t){if(t instanceof ht)Z.warn(t.message);else{const s=oe.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Z.warn(s.message)}}}function wi(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ma=1024,La=30;class Fa{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new $a(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Ss();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r))return;if(this._heartbeatsCache.heartbeats.push({date:r,agent:i}),this._heartbeatsCache.heartbeats.length>La){const o=Ha(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){Z.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Ss(),{heartbeatsToSend:s,unsentEntries:i}=Ba(this._heartbeatsCache.heartbeats),r=Ct(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(t){return Z.warn(t),""}}}function Ss(){return new Date().toISOString().substring(0,10)}function Ba(n,e=Ma){const t=[];let s=n.slice();for(const i of n){const r=t.find(o=>o.agent===i.agent);if(r){if(r.dates.push(i.date),Ts(t)>e){r.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),Ts(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class $a{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Co()?bo().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Oa(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Es(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Es(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function Ts(n){return Ct(JSON.stringify({version:2,heartbeats:n})).length}function Ha(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let s=1;s<n.length;s++)n[s].date<t&&(t=n[s].date,e=s);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wa(n){Et(new tt("platform-logger",e=>new Yo(e),"PRIVATE")),Et(new tt("heartbeat",e=>new Fa(e),"PRIVATE")),ke(gn,ws,n),ke(gn,ws,"esm2020"),ke("fire-js","")}Wa("");var Ua="firebase",Ga="12.6.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ke(Ua,Ga,"app");var xs={};const Rs="@firebase/database",ks="1.1.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ii="";function Ei(n){Ii=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Va{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),P(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:et(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class za{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return K(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Si=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new Va(e)}}catch{}return new za},Ce=Si("localStorage"),ja=Si("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ne=new gi("@firebase/database"),qa=(function(){let n=1;return function(){return n++}})(),Ti=function(n){const e=ko(n),t=new Ro;t.update(e);const s=t.digest();return On.encodeByteArray(s)},dt=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=dt.apply(null,s):typeof s=="object"?e+=P(s):e+=s,e+=" "}return e};let Ye=null,Ns=!0;const Ka=function(n,e){f(!0,"Can't turn on custom loggers persistently."),Ne.logLevel=S.VERBOSE,Ye=Ne.log.bind(Ne)},M=function(...n){if(Ns===!0&&(Ns=!1,Ye===null&&ja.get("logging_enabled")===!0&&Ka()),Ye){const e=dt.apply(null,n);Ye(e)}},ut=function(n){return function(...e){M(n,...e)}},Cn=function(...n){const e="FIREBASE INTERNAL ERROR: "+dt(...n);Ne.error(e)},ee=function(...n){const e=`FIREBASE FATAL ERROR: ${dt(...n)}`;throw Ne.error(e),new Error(e)},B=function(...n){const e="FIREBASE WARNING: "+dt(...n);Ne.warn(e)},Ya=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&B("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},Ht=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},Qa=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},Oe="[MIN_NAME]",be="[MAX_NAME]",Se=function(n,e){if(n===e)return 0;if(n===Oe||e===be)return-1;if(e===Oe||n===be)return 1;{const t=As(n),s=As(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},Ja=function(n,e){return n===e?0:n<e?-1:1},Ve=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+P(e))},Fn=function(n){if(typeof n!="object"||n===null)return P(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=P(e[s]),t+=":",t+=Fn(n[e[s]]);return t+="}",t},xi=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let i=0;i<t;i+=e)i+e>t?s.push(n.substring(i,t)):s.push(n.substring(i,i+e));return s};function L(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Ri=function(n){f(!Ht(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let i,r,o,a,l;n===0?(r=0,o=0,i=1/n===-1/0?1:0):(i=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),s),r=a+s,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-s-t))));const c=[];for(l=t;l;l-=1)c.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)c.push(r%2?1:0),r=Math.floor(r/2);c.push(i?1:0),c.reverse();const u=c.join("");let h="";for(l=0;l<64;l+=8){let d=parseInt(u.substr(l,8),2).toString(16);d.length===1&&(d="0"+d),h=h+d}return h.toLowerCase()},Xa=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},Za=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function el(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const s=new Error(n+" at "+e._path.toString()+": "+t);return s.code=n.toUpperCase(),s}const tl=new RegExp("^-?(0*)\\d{1,10}$"),nl=-2147483648,sl=2147483647,As=function(n){if(tl.test(n)){const e=Number(n);if(e>=nl&&e<=sl)return e}return null},He=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw B("Exception was thrown by user callback.",t),e},Math.floor(0))}},il=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Qe=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rl{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,xa(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){B(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ol{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(i=>this.auth_=i)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(M("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',B(e)}}class vt{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}vt.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn="5",ki="v",Ni="s",Ai="r",Pi="f",Di=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Oi="ls",Mi="p",bn="ac",Li="websocket",Fi="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bi{constructor(e,t,s,i,r=!1,o="",a=!1,l=!1,c=null){this.secure=t,this.namespace=s,this.webSocketOnly=i,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=l,this.emulatorOptions=c,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=Ce.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&Ce.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function al(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function $i(n,e,t){f(typeof e=="string","typeof type must == string"),f(typeof t=="object","typeof params must == object");let s;if(e===Li)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Fi)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);al(n)&&(t.ns=n.namespace);const i=[];return L(t,(r,o)=>{i.push(r+"="+o)}),s+i.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ll{constructor(){this.counters_={}}incrementCounter(e,t=1){K(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return so(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const on={},an={};function $n(n){const e=n.toString();return on[e]||(on[e]=new ll),on[e]}function cl(n,e){const t=n.toString();return an[t]||(an[t]=e()),an[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hl{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let i=0;i<s.length;++i)s[i]&&He(()=>{this.onMessage_(s[i])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ps="start",dl="close",ul="pLPCommand",fl="pRTLPCB",Hi="id",Wi="pw",Ui="ser",pl="cb",ml="seg",_l="ts",gl="d",yl="dframe",Gi=1870,Vi=30,vl=Gi-Vi,Cl=25e3,bl=3e4;class Re{constructor(e,t,s,i,r,o,a){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=ut(e),this.stats_=$n(t),this.urlFn=l=>(this.appCheckToken&&(l[bn]=this.appCheckToken),$i(t,Fi,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new hl(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(bl)),Qa(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Hn((...r)=>{const[o,a,l,c,u]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Ps)this.id=a,this.password=l;else if(o===dl)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,a]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const s={};s[Ps]="t",s[Ui]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[pl]=this.scriptTagHolder.uniqueCallbackIdentifier),s[ki]=Bn,this.transportSessionId&&(s[Ni]=this.transportSessionId),this.lastSessionId&&(s[Oi]=this.lastSessionId),this.applicationId&&(s[Mi]=this.applicationId),this.appCheckToken&&(s[bn]=this.appCheckToken),typeof location<"u"&&location.hostname&&Di.test(location.hostname)&&(s[Ai]=Pi);const i=this.urlFn(s);this.log_("Connecting via long-poll to "+i),this.scriptTagHolder.addTag(i,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Re.forceAllow_=!0}static forceDisallow(){Re.forceDisallow_=!0}static isAvailable(){return Re.forceAllow_?!0:!Re.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!Xa()&&!Za()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=P(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=hi(t),i=xi(s,vl);for(let r=0;r<i.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[yl]="t",s[Hi]=e,s[Wi]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=P(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Hn{constructor(e,t,s,i){this.onDisconnect=s,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=qa(),window[ul+this.uniqueCallbackIdentifier]=e,window[fl+this.uniqueCallbackIdentifier]=t,this.myIFrame=Hn.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){M("frame writing exception"),a.stack&&M(a.stack),M(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||M("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[Hi]=this.myID,e[Wi]=this.myPW,e[Ui]=this.currentSerial;let t=this.urlFn(e),s="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+Vi+s.length<=Gi;){const o=this.pendingSegs.shift();s=s+"&"+ml+i+"="+o.seg+"&"+_l+i+"="+o.ts+"&"+gl+i+"="+o.d,i++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(s,Math.floor(Cl)),r=()=>{clearTimeout(i),s()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const i=s.readyState;(!i||i==="loaded"||i==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{M("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wl=16384,Il=45e3;let St=null;typeof MozWebSocket<"u"?St=MozWebSocket:typeof WebSocket<"u"&&(St=WebSocket);class U{constructor(e,t,s,i,r,o,a){this.connId=e,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=ut(this.connId),this.stats_=$n(t),this.connURL=U.connectionURL_(t,o,a,i,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,i,r){const o={};return o[ki]=Bn,typeof location<"u"&&location.hostname&&Di.test(location.hostname)&&(o[Ai]=Pi),t&&(o[Ni]=t),s&&(o[Oi]=s),i&&(o[bn]=i),r&&(o[Mi]=r),$i(e,Li,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,Ce.set("previous_websocket_failure",!0);try{let s;vo(),this.mySock=new St(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_()}}start(){}static forceDisallow(){U.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&St!==null&&!U.forceDisallow_}static previouslyFailed(){return Ce.isInMemoryStorage||Ce.get("previous_websocket_failure")===!0}markConnectionHealthy(){Ce.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=et(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(f(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=P(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=xi(t,wl);s.length>1&&this.sendString_(String(s.length));for(let i=0;i<s.length;i++)this.sendString_(s[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Il))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}U.responsesRequiredToBeHealthy=2;U.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class st{static get ALL_TRANSPORTS(){return[Re,U]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=U&&U.isAvailable();let s=t&&!U.previouslyFailed();if(e.webSocketOnly&&(t||B("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[U];else{const i=this.transports_=[];for(const r of st.ALL_TRANSPORTS)r&&r.isAvailable()&&i.push(r);st.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}st.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const El=6e4,Sl=5e3,Tl=10*1024,xl=100*1024,ln="t",Ds="d",Rl="s",Os="r",kl="e",Ms="o",Ls="a",Fs="n",Bs="p",Nl="h";class Al{constructor(e,t,s,i,r,o,a,l,c,u){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=i,this.authToken_=r,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=l,this.onKill_=c,this.lastSessionId=u,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=ut("c:"+this.id+":"),this.transportManager_=new st(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=Qe(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>xl?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Tl?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(ln in e){const t=e[ln];t===Ls?this.upgradeIfSecondaryHealthy_():t===Os?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===Ms&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Ve("t",e),s=Ve("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Bs,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Ls,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Fs,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Ve("t",e),s=Ve("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Ve(ln,e);if(Ds in e){const s=e[Ds];if(t===Nl){const i={...s};this.repoInfo_.isUsingEmulator&&(i.h=this.repoInfo_.host),this.onHandshake_(i)}else if(t===Fs){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let i=0;i<this.pendingDataMessages.length;++i)this.onDataMessage_(this.pendingDataMessages[i]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===Rl?this.onConnectionShutdown_(s):t===Os?this.onReset_(s):t===kl?Cn("Server Error: "+s):t===Ms?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Cn("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Bn!==s&&B("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),Qe(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(El))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Qe(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(Sl))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Bs,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(Ce.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zi{put(e,t,s,i){}merge(e,t,s,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ji{constructor(e){this.allowedEvents_=e,this.listeners_={},f(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let i=0;i<s.length;i++)s[i].callback.apply(s[i].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const i=this.getInitialEvent(e);i&&t.apply(s,i)}off(e,t,s){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let r=0;r<i.length;r++)if(i[r].callback===t&&(!s||s===i[r].context)){i.splice(r,1);return}}validateEventType_(e){f(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tt extends ji{static getInstance(){return new Tt}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!pi()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return f(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $s=32,Hs=768;class w{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let i=0;i<this.pieces_.length;i++)this.pieces_[i].length>0&&(this.pieces_[s]=this.pieces_[i],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function b(){return new w("")}function g(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function ce(n){return n.pieces_.length-n.pieceNum_}function I(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new w(n.pieces_,e)}function Wn(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function Pl(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function it(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function qi(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new w(e,0)}function k(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof w)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let i=0;i<s.length;i++)s[i].length>0&&t.push(s[i])}return new w(t,0)}function y(n){return n.pieceNum_>=n.pieces_.length}function F(n,e){const t=g(n),s=g(e);if(t===null)return e;if(t===s)return F(I(n),I(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function Dl(n,e){const t=it(n,0),s=it(e,0);for(let i=0;i<t.length&&i<s.length;i++){const r=Se(t[i],s[i]);if(r!==0)return r}return t.length===s.length?0:t.length<s.length?-1:1}function Un(n,e){if(ce(n)!==ce(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function H(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(ce(n)>ce(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class Ol{constructor(e,t){this.errorPrefix_=t,this.parts_=it(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=$t(this.parts_[s]);Ki(this)}}function Ml(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=$t(e),Ki(n)}function Ll(n){const e=n.parts_.pop();n.byteLength_-=$t(e),n.parts_.length>0&&(n.byteLength_-=1)}function Ki(n){if(n.byteLength_>Hs)throw new Error(n.errorPrefix_+"has a key path longer than "+Hs+" bytes ("+n.byteLength_+").");if(n.parts_.length>$s)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+$s+") or object contains a cycle "+_e(n))}function _e(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gn extends ji{static getInstance(){return new Gn}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}getInitialEvent(e){return f(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ze=1e3,Fl=300*1e3,Ws=30*1e3,Bl=1.3,$l=3e4,Hl="server_kill",Us=3;class X extends zi{constructor(e,t,s,i,r,o,a,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=i,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=l,this.id=X.nextPersistentConnectionId_++,this.log_=ut("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=ze,this.maxReconnectDelay_=Fl,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Gn.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&Tt.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const i=++this.requestNumber_,r={r:i,a:e,b:t};this.log_(P(r)),f(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),s&&(this.requestCBHash_[i]=s)}get(e){this.initConnection_();const t=new j,i={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(i),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,s,i){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),f(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),f(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:i,hashFn:t,query:e,tag:s};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+s+" for "+i);const r={p:s},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,a=>{const l=a.d,c=a.s;X.warnOnListenWarnings_(l,t),(this.listens.get(s)&&this.listens.get(s).get(i))===e&&(this.log_("listen response",a),c!=="ok"&&this.removeListen_(s,i),e.onComplete&&e.onComplete(c,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&K(e,"w")){const s=Pe(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const i='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();B(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${i} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||To(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Ws)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=So(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,i=>{const r=i.s,o=i.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),i=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+i),f(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,i)&&this.connected_&&this.sendUnlisten_(s,i,e._queryObject,t)}sendUnlisten_(e,t,s,i){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";i&&(r.q=s,r.t=i),this.sendRequest(o,r)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,i){const r={p:t,d:s};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{i&&setTimeout(()=>{i(o.s,o.d)},Math.floor(0))})}put(e,t,s,i){this.putInternal("p",e,t,s,i)}merge(e,t,s,i){this.putInternal("m",e,t,s,i)}putInternal(e,t,s,i,r){this.initConnection_();const o={p:t,d:s};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:i}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),i&&i(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const r=s.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+P(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Cn("Unrecognized action received from server: "+P(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){f(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=ze,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=ze,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>$l&&(this.reconnectDelay_=ze),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*Bl)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),i=this.id+":"+X.nextConnectionId_++,r=this.lastSessionId;let o=!1,a=null;const l=function(){a?a.close():(o=!0,s())},c=function(h){f(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(h)};this.realtime_={close:l,sendRequest:c};const u=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[h,d]=await Promise.all([this.authTokenProvider_.getToken(u),this.appCheckTokenProvider_.getToken(u)]);o?M("getToken() completed but was canceled"):(M("getToken() completed. Creating connection."),this.authToken_=h&&h.accessToken,this.appCheckToken_=d&&d.token,a=new Al(i,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,p=>{B(p+" ("+this.repoInfo_.toString()+")"),this.interrupt(Hl)},r))}catch(h){this.log_("Failed to get token: "+h),o||(this.repoInfo_.nodeAdmin&&B(h),l())}}}interrupt(e){M("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){M("Resuming connection for reason: "+e),delete this.interruptReasons_[e],pn(this.interruptReasons_)&&(this.reconnectDelay_=ze,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(r=>Fn(r)).join("$"):s="default";const i=this.removeListen_(e,s);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const s=new w(e).toString();let i;if(this.listens.has(s)){const r=this.listens.get(s);i=r.get(t),r.delete(t),r.size===0&&this.listens.delete(s)}else i=void 0;return i}onAuthRevoked_(e,t){M("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Us&&(this.reconnectDelay_=Ws,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){M("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Us&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Ii.replace(/\./g,"-")]=1,pi()?e["framework.cordova"]=1:yo()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=Tt.getInstance().currentlyOnline();return pn(this.interruptReasons_)&&e}}X.nextPersistentConnectionId_=0;X.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new v(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new v(Oe,e),i=new v(Oe,t);return this.compare(s,i)!==0}minPost(){return v.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let gt;class Yi extends Wt{static get __EMPTY_NODE(){return gt}static set __EMPTY_NODE(e){gt=e}compare(e,t){return Se(e.name,t.name)}isDefinedOn(e){throw $e("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return v.MIN}maxPost(){return new v(be,gt)}makePost(e,t){return f(typeof e=="string","KeyIndex indexValue must always be a string."),new v(e,gt)}toString(){return".key"}}const Ae=new Yi;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(e,t,s,i,r=null){this.isReverse_=i,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?s(e.key,t):1,i&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class O{constructor(e,t,s,i,r){this.key=e,this.value=t,this.color=s??O.RED,this.left=i??$.EMPTY_NODE,this.right=r??$.EMPTY_NODE}copy(e,t,s,i,r){return new O(e??this.key,t??this.value,s??this.color,i??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let i=this;const r=s(e,i.key);return r<0?i=i.copy(null,null,null,i.left.insert(e,t,s),null):r===0?i=i.copy(null,t,null,null,null):i=i.copy(null,null,null,null,i.right.insert(e,t,s)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return $.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,i;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return $.EMPTY_NODE;i=s.right.min_(),s=s.copy(i.key,i.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,O.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,O.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}O.RED=!0;O.BLACK=!1;class Wl{copy(e,t,s,i,r){return this}insert(e,t,s){return new O(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class ${constructor(e,t=$.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new $(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,O.BLACK,null,null))}remove(e){return new $(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,O.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,i=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return i?i.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(i=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new yt(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new yt(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new yt(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new yt(this.root_,null,this.comparator_,!0,e)}}$.EMPTY_NODE=new Wl;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ul(n,e){return Se(n.name,e.name)}function Vn(n,e){return Se(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let wn;function Gl(n){wn=n}const Qi=function(n){return typeof n=="number"?"number:"+Ri(n):"string:"+n},Ji=function(n){if(n.isLeafNode()){const e=n.val();f(typeof e=="string"||typeof e=="number"||typeof e=="object"&&K(e,".sv"),"Priority must be a string or number.")}else f(n===wn||n.isEmpty(),"priority of unexpected type.");f(n===wn||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Gs;class D{static set __childrenNodeConstructor(e){Gs=e}static get __childrenNodeConstructor(){return Gs}constructor(e,t=D.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,f(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),Ji(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new D(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:D.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return y(e)?this:g(e)===".priority"?this.priorityNode_:D.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:D.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=g(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(f(s!==".priority"||ce(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,D.__childrenNodeConstructor.EMPTY_NODE.updateChild(I(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+Qi(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Ri(this.value_):e+=this.value_,this.lazyHash_=Ti(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===D.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof D.__childrenNodeConstructor?-1:(f(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,i=D.VALUE_TYPE_ORDER.indexOf(t),r=D.VALUE_TYPE_ORDER.indexOf(s);return f(i>=0,"Unknown leaf type: "+t),f(r>=0,"Unknown leaf type: "+s),i===r?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-i}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}D.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Xi,Zi;function Vl(n){Xi=n}function zl(n){Zi=n}class jl extends Wt{compare(e,t){const s=e.node.getPriority(),i=t.node.getPriority(),r=s.compareTo(i);return r===0?Se(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return v.MIN}maxPost(){return new v(be,new D("[PRIORITY-POST]",Zi))}makePost(e,t){const s=Xi(e);return new v(t,new D("[PRIORITY-POST]",s))}toString(){return".priority"}}const N=new jl;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ql=Math.log(2);class Kl{constructor(e){const t=r=>parseInt(Math.log(r)/ql,10),s=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const i=s(this.count);this.bits_=e+1&i}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const xt=function(n,e,t,s){n.sort(e);const i=function(l,c){const u=c-l;let h,d;if(u===0)return null;if(u===1)return h=n[l],d=t?t(h):h,new O(d,h.node,O.BLACK,null,null);{const p=parseInt(u/2,10)+l,m=i(l,p),C=i(p+1,c);return h=n[p],d=t?t(h):h,new O(d,h.node,O.BLACK,m,C)}},r=function(l){let c=null,u=null,h=n.length;const d=function(m,C){const T=h-m,Y=h;h-=m;const Q=i(T+1,Y),pe=n[T],en=t?t(pe):pe;p(new O(en,pe.node,C,null,Q))},p=function(m){c?(c.left=m,c=m):(u=m,c=m)};for(let m=0;m<l.count;++m){const C=l.nextBitIsOne(),T=Math.pow(2,l.count-(m+1));C?d(T,O.BLACK):(d(T,O.BLACK),d(T,O.RED))}return u},o=new Kl(n.length),a=r(o);return new $(s||e,a)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let cn;const xe={};class J{static get Default(){return f(xe&&N,"ChildrenNode.ts has not been loaded"),cn=cn||new J({".priority":xe},{".priority":N}),cn}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=Pe(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof $?t:null}hasIndex(e){return K(this.indexSet_,e.toString())}addIndex(e,t){f(e!==Ae,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let i=!1;const r=t.getIterator(v.Wrap);let o=r.getNext();for(;o;)i=i||e.isDefinedOn(o.node),s.push(o),o=r.getNext();let a;i?a=xt(s,e.getCompare()):a=xe;const l=e.toString(),c={...this.indexSet_};c[l]=e;const u={...this.indexes_};return u[l]=a,new J(u,c)}addToIndexes(e,t){const s=bt(this.indexes_,(i,r)=>{const o=Pe(this.indexSet_,r);if(f(o,"Missing index implementation for "+r),i===xe)if(o.isDefinedOn(e.node)){const a=[],l=t.getIterator(v.Wrap);let c=l.getNext();for(;c;)c.name!==e.name&&a.push(c),c=l.getNext();return a.push(e),xt(a,o.getCompare())}else return xe;else{const a=t.get(e.name);let l=i;return a&&(l=l.remove(new v(e.name,a))),l.insert(e,e.node)}});return new J(s,this.indexSet_)}removeFromIndexes(e,t){const s=bt(this.indexes_,i=>{if(i===xe)return i;{const r=t.get(e.name);return r?i.remove(new v(e.name,r)):i}});return new J(s,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let je;class _{static get EMPTY_NODE(){return je||(je=new _(new $(Vn),null,J.Default))}constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&Ji(this.priorityNode_),this.children_.isEmpty()&&f(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||je}updatePriority(e){return this.children_.isEmpty()?this:new _(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?je:t}}getChild(e){const t=g(e);return t===null?this:this.getImmediateChild(t).getChild(I(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(f(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new v(e,t);let i,r;t.isEmpty()?(i=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(s,this.children_)):(i=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(s,this.children_));const o=i.isEmpty()?je:this.priorityNode_;return new _(i,o,r)}}updateChild(e,t){const s=g(e);if(s===null)return t;{f(g(e)!==".priority"||ce(e)===1,".priority must be the last token in a path");const i=this.getImmediateChild(s).updateChild(I(e),t);return this.updateImmediateChild(s,i)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,i=0,r=!0;if(this.forEachChild(N,(o,a)=>{t[o]=a.val(e),s++,r&&_.INTEGER_REGEXP_.test(o)?i=Math.max(i,Number(o)):r=!1}),!e&&r&&i<2*s){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+Qi(this.getPriority().val())+":"),this.forEachChild(N,(t,s)=>{const i=s.hash();i!==""&&(e+=":"+t+":"+i)}),this.lazyHash_=e===""?"":Ti(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const i=this.resolveIndex_(s);if(i){const r=i.getPredecessorKey(new v(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new v(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new v(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(i=>t(i.name,i.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,i=>i);{const i=this.children_.getIteratorFrom(e.name,v.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)<0;)i.getNext(),r=i.peek();return i}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,i=>i);{const i=this.children_.getReverseIteratorFrom(e.name,v.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)>0;)i.getNext(),r=i.peek();return i}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===ft?-1:0}withIndex(e){if(e===Ae||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new _(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Ae||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(N),i=t.getIterator(N);let r=s.getNext(),o=i.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=s.getNext(),o=i.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===Ae?null:this.indexMap_.get(e.toString())}}_.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class Yl extends _{constructor(){super(new $(Vn),_.EMPTY_NODE,J.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return _.EMPTY_NODE}isEmpty(){return!1}}const ft=new Yl;Object.defineProperties(v,{MIN:{value:new v(Oe,_.EMPTY_NODE)},MAX:{value:new v(be,ft)}});Yi.__EMPTY_NODE=_.EMPTY_NODE;D.__childrenNodeConstructor=_;Gl(ft);zl(ft);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ql=!0;function A(n,e=null){if(n===null)return _.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),f(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new D(t,A(e))}if(!(n instanceof Array)&&Ql){const t=[];let s=!1;if(L(n,(o,a)=>{if(o.substring(0,1)!=="."){const l=A(a);l.isEmpty()||(s=s||!l.getPriority().isEmpty(),t.push(new v(o,l)))}}),t.length===0)return _.EMPTY_NODE;const r=xt(t,Ul,o=>o.name,Vn);if(s){const o=xt(t,N.getCompare());return new _(r,A(e),new J({".priority":o},{".priority":N}))}else return new _(r,A(e),J.Default)}else{let t=_.EMPTY_NODE;return L(n,(s,i)=>{if(K(n,s)&&s.substring(0,1)!=="."){const r=A(i);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(s,r))}}),t.updatePriority(A(e))}}Vl(A);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jl extends Wt{constructor(e){super(),this.indexPath_=e,f(!y(e)&&g(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),i=this.extractChild(t.node),r=s.compareTo(i);return r===0?Se(e.name,t.name):r}makePost(e,t){const s=A(e),i=_.EMPTY_NODE.updateChild(this.indexPath_,s);return new v(t,i)}maxPost(){const e=_.EMPTY_NODE.updateChild(this.indexPath_,ft);return new v(be,e)}toString(){return it(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xl extends Wt{compare(e,t){const s=e.node.compareTo(t.node);return s===0?Se(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return v.MIN}maxPost(){return v.MAX}makePost(e,t){const s=A(e);return new v(t,s)}toString(){return".value"}}const Zl=new Xl;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function er(n){return{type:"value",snapshotNode:n}}function Me(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function rt(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function ot(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function ec(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zn{constructor(e){this.index_=e}updateChild(e,t,s,i,r,o){f(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(i).equals(s.getChild(i))&&a.isEmpty()===s.isEmpty()||(o!=null&&(s.isEmpty()?e.hasChild(t)?o.trackChildChange(rt(t,a)):f(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(Me(t,s)):o.trackChildChange(ot(t,s,a))),e.isLeafNode()&&s.isEmpty())?e:e.updateImmediateChild(t,s).withIndex(this.index_)}updateFullNode(e,t,s){return s!=null&&(e.isLeafNode()||e.forEachChild(N,(i,r)=>{t.hasChild(i)||s.trackChildChange(rt(i,r))}),t.isLeafNode()||t.forEachChild(N,(i,r)=>{if(e.hasChild(i)){const o=e.getImmediateChild(i);o.equals(r)||s.trackChildChange(ot(i,r,o))}else s.trackChildChange(Me(i,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?_.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class at{constructor(e){this.indexedFilter_=new zn(e.getIndex()),this.index_=e.getIndex(),this.startPost_=at.getStartPost_(e),this.endPost_=at.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,s=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&s}updateChild(e,t,s,i,r,o){return this.matches(new v(t,s))||(s=_.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,s,i,r,o)}updateFullNode(e,t,s){t.isLeafNode()&&(t=_.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(_.EMPTY_NODE);const r=this;return t.forEachChild(N,(o,a)=>{r.matches(new v(o,a))||(i=i.updateImmediateChild(o,_.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tc{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const s=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?s<=0:s<0},this.withinEndPost=t=>{const s=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?s<=0:s<0},this.rangedFilter_=new at(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,s,i,r,o){return this.rangedFilter_.matches(new v(t,s))||(s=_.EMPTY_NODE),e.getImmediateChild(t).equals(s)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,s,i,r,o):this.fullLimitUpdateChild_(e,t,s,r,o)}updateFullNode(e,t,s){let i;if(t.isLeafNode()||t.isEmpty())i=_.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){i=_.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const a=r.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))i=i.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{i=t.withIndex(this.index_),i=i.updatePriority(_.EMPTY_NODE);let r;this.reverse_?r=i.getReverseIterator(this.index_):r=i.getIterator(this.index_);let o=0;for(;r.hasNext();){const a=r.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:i=i.updateImmediateChild(a.name,_.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,s,i,r){let o;if(this.reverse_){const h=this.index_.getCompare();o=(d,p)=>h(p,d)}else o=this.index_.getCompare();const a=e;f(a.numChildren()===this.limit_,"");const l=new v(t,s),c=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),u=this.rangedFilter_.matches(l);if(a.hasChild(t)){const h=a.getImmediateChild(t);let d=i.getChildAfterChild(this.index_,c,this.reverse_);for(;d!=null&&(d.name===t||a.hasChild(d.name));)d=i.getChildAfterChild(this.index_,d,this.reverse_);const p=d==null?1:o(d,l);if(u&&!s.isEmpty()&&p>=0)return r!=null&&r.trackChildChange(ot(t,s,h)),a.updateImmediateChild(t,s);{r!=null&&r.trackChildChange(rt(t,h));const C=a.updateImmediateChild(t,_.EMPTY_NODE);return d!=null&&this.rangedFilter_.matches(d)?(r!=null&&r.trackChildChange(Me(d.name,d.node)),C.updateImmediateChild(d.name,d.node)):C}}else return s.isEmpty()?e:u&&o(c,l)>=0?(r!=null&&(r.trackChildChange(rt(c.name,c.node)),r.trackChildChange(Me(t,s))),a.updateImmediateChild(t,s).updateImmediateChild(c.name,_.EMPTY_NODE)):e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=N}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return f(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return f(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Oe}hasEnd(){return this.endSet_}getIndexEndValue(){return f(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return f(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:be}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return f(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===N}copy(){const e=new Ut;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function nc(n){return n.loadsAllData()?new zn(n.getIndex()):n.hasLimit()?new tc(n):new at(n)}function Vs(n){const e={};if(n.isDefault())return e;let t;if(n.index_===N?t="$priority":n.index_===Zl?t="$value":n.index_===Ae?t="$key":(f(n.index_ instanceof Jl,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=P(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=P(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+P(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=P(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+P(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function zs(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==N&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt extends zi{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(f(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,s,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=i,this.log_=ut("p:rest:"),this.listens_={}}listen(e,t,s,i){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=Rt.getListenId_(e,s),a={};this.listens_[o]=a;const l=Vs(e._queryParams);this.restRequest_(r+".json",l,(c,u)=>{let h=u;if(c===404&&(h=null,c=null),c===null&&this.onDataUpdate_(r,h,!1,s),Pe(this.listens_,o)===a){let d;c?c===401?d="permission_denied":d="rest_error:"+c:d="ok",i(d,null)}})}unlisten(e,t){const s=Rt.getListenId_(e,t);delete this.listens_[s]}get(e){const t=Vs(e._queryParams),s=e._path.toString(),i=new j;return this.restRequest_(s+".json",t,(r,o)=>{let a=o;r===404&&(a=null,r=null),r===null?(this.onDataUpdate_(s,a,!1,null),i.resolve(a)):i.reject(new Error(a))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,r])=>{i&&i.accessToken&&(t.auth=i.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+xo(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(s&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let l=null;if(a.status>=200&&a.status<300){try{l=et(a.responseText)}catch{B("Failed to parse JSON response for "+o+": "+a.responseText)}s(null,l)}else a.status!==401&&a.status!==404&&B("Got unsuccessful REST response for "+o+" Status: "+a.status),s(a.status);s=null}},a.open("GET",o,!0),a.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sc{constructor(){this.rootNode_=_.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kt(){return{value:null,children:new Map}}function We(n,e,t){if(y(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=g(e);n.children.has(s)||n.children.set(s,kt());const i=n.children.get(s);e=I(e),We(i,e,t)}}function In(n,e){if(y(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(N,(s,i)=>{We(n,new w(s),i)}),In(n,e)}}else if(n.children.size>0){const t=g(e);return e=I(e),n.children.has(t)&&In(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function En(n,e,t){n.value!==null?t(e,n.value):ic(n,(s,i)=>{const r=new w(e.toString()+"/"+s);En(i,r,t)})}function ic(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rc{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&L(this.last_,(s,i)=>{t[s]=t[s]-i}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const js=10*1e3,oc=30*1e3,ac=300*1e3;class lc{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new rc(e);const s=js+(oc-js)*Math.random();Qe(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;L(e,(i,r)=>{r>0&&K(this.statsToReport_,i)&&(t[i]=r,s=!0)}),s&&this.server_.reportStats(t),Qe(this.reportStats_.bind(this),Math.floor(Math.random()*2*ac))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var G;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(G||(G={}));function jn(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function qn(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Kn(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nt{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=G.ACK_USER_WRITE,this.source=jn()}operationForChild(e){if(y(this.path)){if(this.affectedTree.value!=null)return f(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new w(e));return new Nt(b(),t,this.revert)}}else return f(g(this.path)===e,"operationForChild called for unrelated child."),new Nt(I(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(e,t){this.source=e,this.path=t,this.type=G.LISTEN_COMPLETE}operationForChild(e){return y(this.path)?new lt(this.source,b()):new lt(this.source,I(this.path))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class we{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=G.OVERWRITE}operationForChild(e){return y(this.path)?new we(this.source,b(),this.snap.getImmediateChild(e)):new we(this.source,I(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=G.MERGE}operationForChild(e){if(y(this.path)){const t=this.children.subtree(new w(e));return t.isEmpty()?null:t.value?new we(this.source,b(),t.value):new Le(this.source,b(),t)}else return f(g(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Le(this.source,I(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class he{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(y(e))return this.isFullyInitialized()&&!this.filtered_;const t=g(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cc{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function hc(n,e,t,s){const i=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(ec(o.childName,o.snapshotNode))}),qe(n,i,"child_removed",e,s,t),qe(n,i,"child_added",e,s,t),qe(n,i,"child_moved",r,s,t),qe(n,i,"child_changed",e,s,t),qe(n,i,"value",e,s,t),i}function qe(n,e,t,s,i,r){const o=s.filter(a=>a.type===t);o.sort((a,l)=>uc(n,a,l)),o.forEach(a=>{const l=dc(n,a,r);i.forEach(c=>{c.respondsTo(a.type)&&e.push(c.createEvent(l,n.query_))})})}function dc(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function uc(n,e,t){if(e.childName==null||t.childName==null)throw $e("Should only compare child_ events.");const s=new v(e.childName,e.snapshotNode),i=new v(t.childName,t.snapshotNode);return n.index_.compare(s,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gt(n,e){return{eventCache:n,serverCache:e}}function Je(n,e,t,s){return Gt(new he(e,t,s),n.serverCache)}function tr(n,e,t,s){return Gt(n.eventCache,new he(e,t,s))}function At(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Ie(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let hn;const fc=()=>(hn||(hn=new $(Ja)),hn);class E{static fromObject(e){let t=new E(null);return L(e,(s,i)=>{t=t.set(new w(s),i)}),t}constructor(e,t=fc()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:b(),value:this.value};if(y(e))return null;{const s=g(e),i=this.children.get(s);if(i!==null){const r=i.findRootMostMatchingPathAndValue(I(e),t);return r!=null?{path:k(new w(s),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(y(e))return this;{const t=g(e),s=this.children.get(t);return s!==null?s.subtree(I(e)):new E(null)}}set(e,t){if(y(e))return new E(t,this.children);{const s=g(e),r=(this.children.get(s)||new E(null)).set(I(e),t),o=this.children.insert(s,r);return new E(this.value,o)}}remove(e){if(y(e))return this.children.isEmpty()?new E(null):new E(null,this.children);{const t=g(e),s=this.children.get(t);if(s){const i=s.remove(I(e));let r;return i.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,i),this.value===null&&r.isEmpty()?new E(null):new E(this.value,r)}else return this}}get(e){if(y(e))return this.value;{const t=g(e),s=this.children.get(t);return s?s.get(I(e)):null}}setTree(e,t){if(y(e))return t;{const s=g(e),r=(this.children.get(s)||new E(null)).setTree(I(e),t);let o;return r.isEmpty()?o=this.children.remove(s):o=this.children.insert(s,r),new E(this.value,o)}}fold(e){return this.fold_(b(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((i,r)=>{s[i]=r.fold_(k(e,i),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,b(),t)}findOnPath_(e,t,s){const i=this.value?s(t,this.value):!1;if(i)return i;if(y(e))return null;{const r=g(e),o=this.children.get(r);return o?o.findOnPath_(I(e),k(t,r),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,b(),t)}foreachOnPath_(e,t,s){if(y(e))return this;{this.value&&s(t,this.value);const i=g(e),r=this.children.get(i);return r?r.foreachOnPath_(I(e),k(t,i),s):new E(null)}}foreach(e){this.foreach_(b(),e)}foreach_(e,t){this.children.inorderTraversal((s,i)=>{i.foreach_(k(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V{constructor(e){this.writeTree_=e}static empty(){return new V(new E(null))}}function Xe(n,e,t){if(y(e))return new V(new E(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const i=s.path;let r=s.value;const o=F(i,e);return r=r.updateChild(o,t),new V(n.writeTree_.set(i,r))}else{const i=new E(t),r=n.writeTree_.setTree(e,i);return new V(r)}}}function Sn(n,e,t){let s=n;return L(t,(i,r)=>{s=Xe(s,k(e,i),r)}),s}function qs(n,e){if(y(e))return V.empty();{const t=n.writeTree_.setTree(e,new E(null));return new V(t)}}function Tn(n,e){return Te(n,e)!=null}function Te(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(F(t.path,e)):null}function Ks(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(N,(s,i)=>{e.push(new v(s,i))}):n.writeTree_.children.inorderTraversal((s,i)=>{i.value!=null&&e.push(new v(s,i.value))}),e}function ae(n,e){if(y(e))return n;{const t=Te(n,e);return t!=null?new V(new E(t)):new V(n.writeTree_.subtree(e))}}function xn(n){return n.writeTree_.isEmpty()}function Fe(n,e){return nr(b(),n.writeTree_,e)}function nr(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((i,r)=>{i===".priority"?(f(r.value!==null,"Priority writes must always be leaf nodes"),s=r.value):t=nr(k(n,i),r,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(k(n,".priority"),s)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vt(n,e){return or(e,n)}function pc(n,e,t,s,i){f(s>n.lastWriteId,"Stacking an older write on top of newer ones"),i===void 0&&(i=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:i}),i&&(n.visibleWrites=Xe(n.visibleWrites,e,t)),n.lastWriteId=s}function mc(n,e,t,s){f(s>n.lastWriteId,"Stacking an older merge on top of newer ones"),n.allWrites.push({path:e,children:t,writeId:s,visible:!0}),n.visibleWrites=Sn(n.visibleWrites,e,t),n.lastWriteId=s}function _c(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function gc(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);f(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let i=s.visible,r=!1,o=n.allWrites.length-1;for(;i&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&yc(a,s.path)?i=!1:H(s.path,a.path)&&(r=!0)),o--}if(i){if(r)return vc(n),!0;if(s.snap)n.visibleWrites=qs(n.visibleWrites,s.path);else{const a=s.children;L(a,l=>{n.visibleWrites=qs(n.visibleWrites,k(s.path,l))})}return!0}else return!1}function yc(n,e){if(n.snap)return H(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&H(k(n.path,t),e))return!0;return!1}function vc(n){n.visibleWrites=sr(n.allWrites,Cc,b()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function Cc(n){return n.visible}function sr(n,e,t){let s=V.empty();for(let i=0;i<n.length;++i){const r=n[i];if(e(r)){const o=r.path;let a;if(r.snap)H(t,o)?(a=F(t,o),s=Xe(s,a,r.snap)):H(o,t)&&(a=F(o,t),s=Xe(s,b(),r.snap.getChild(a)));else if(r.children){if(H(t,o))a=F(t,o),s=Sn(s,a,r.children);else if(H(o,t))if(a=F(o,t),y(a))s=Sn(s,b(),r.children);else{const l=Pe(r.children,g(a));if(l){const c=l.getChild(I(a));s=Xe(s,b(),c)}}}else throw $e("WriteRecord should have .snap or .children")}}return s}function ir(n,e,t,s,i){if(!s&&!i){const r=Te(n.visibleWrites,e);if(r!=null)return r;{const o=ae(n.visibleWrites,e);if(xn(o))return t;if(t==null&&!Tn(o,b()))return null;{const a=t||_.EMPTY_NODE;return Fe(o,a)}}}else{const r=ae(n.visibleWrites,e);if(!i&&xn(r))return t;if(!i&&t==null&&!Tn(r,b()))return null;{const o=function(c){return(c.visible||i)&&(!s||!~s.indexOf(c.writeId))&&(H(c.path,e)||H(e,c.path))},a=sr(n.allWrites,o,e),l=t||_.EMPTY_NODE;return Fe(a,l)}}}function bc(n,e,t){let s=_.EMPTY_NODE;const i=Te(n.visibleWrites,e);if(i)return i.isLeafNode()||i.forEachChild(N,(r,o)=>{s=s.updateImmediateChild(r,o)}),s;if(t){const r=ae(n.visibleWrites,e);return t.forEachChild(N,(o,a)=>{const l=Fe(ae(r,new w(o)),a);s=s.updateImmediateChild(o,l)}),Ks(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}else{const r=ae(n.visibleWrites,e);return Ks(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}}function wc(n,e,t,s,i){f(s||i,"Either existingEventSnap or existingServerSnap must exist");const r=k(e,t);if(Tn(n.visibleWrites,r))return null;{const o=ae(n.visibleWrites,r);return xn(o)?i.getChild(t):Fe(o,i.getChild(t))}}function Ic(n,e,t,s){const i=k(e,t),r=Te(n.visibleWrites,i);if(r!=null)return r;if(s.isCompleteForChild(t)){const o=ae(n.visibleWrites,i);return Fe(o,s.getNode().getImmediateChild(t))}else return null}function Ec(n,e){return Te(n.visibleWrites,e)}function Sc(n,e,t,s,i,r,o){let a;const l=ae(n.visibleWrites,e),c=Te(l,b());if(c!=null)a=c;else if(t!=null)a=Fe(l,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const u=[],h=o.getCompare(),d=r?a.getReverseIteratorFrom(s,o):a.getIteratorFrom(s,o);let p=d.getNext();for(;p&&u.length<i;)h(p,s)!==0&&u.push(p),p=d.getNext();return u}else return[]}function Tc(){return{visibleWrites:V.empty(),allWrites:[],lastWriteId:-1}}function Pt(n,e,t,s){return ir(n.writeTree,n.treePath,e,t,s)}function Yn(n,e){return bc(n.writeTree,n.treePath,e)}function Ys(n,e,t,s){return wc(n.writeTree,n.treePath,e,t,s)}function Dt(n,e){return Ec(n.writeTree,k(n.treePath,e))}function xc(n,e,t,s,i,r){return Sc(n.writeTree,n.treePath,e,t,s,i,r)}function Qn(n,e,t){return Ic(n.writeTree,n.treePath,e,t)}function rr(n,e){return or(k(n.treePath,e),n.writeTree)}function or(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rc{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;f(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),f(s!==".priority","Only non-priority child changes can be tracked.");const i=this.changeMap.get(s);if(i){const r=i.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(s,ot(s,e.snapshotNode,i.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(s,rt(s,i.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(s,Me(s,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(s,ot(s,e.snapshotNode,i.oldSnap));else throw $e("Illegal combination of changes: "+e+" occurred after "+i)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kc{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const ar=new kc;class Jn{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new he(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Qn(this.writes_,e,s)}}getChildAfterChild(e,t,s){const i=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Ie(this.viewCache_),r=xc(this.writes_,i,t,1,s,e);return r.length===0?null:r[0]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nc(n){return{filter:n}}function Ac(n,e){f(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),f(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function Pc(n,e,t,s,i){const r=new Rc;let o,a;if(t.type===G.OVERWRITE){const c=t;c.source.fromUser?o=Rn(n,e,c.path,c.snap,s,i,r):(f(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered()&&!y(c.path),o=Ot(n,e,c.path,c.snap,s,i,a,r))}else if(t.type===G.MERGE){const c=t;c.source.fromUser?o=Oc(n,e,c.path,c.children,s,i,r):(f(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered(),o=kn(n,e,c.path,c.children,s,i,a,r))}else if(t.type===G.ACK_USER_WRITE){const c=t;c.revert?o=Fc(n,e,c.path,s,i,r):o=Mc(n,e,c.path,c.affectedTree,s,i,r)}else if(t.type===G.LISTEN_COMPLETE)o=Lc(n,e,t.path,s,r);else throw $e("Unknown operation type: "+t.type);const l=r.getChanges();return Dc(e,o,l),{viewCache:o,changes:l}}function Dc(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const i=s.getNode().isLeafNode()||s.getNode().isEmpty(),r=At(n);(t.length>0||!n.eventCache.isFullyInitialized()||i&&!s.getNode().equals(r)||!s.getNode().getPriority().equals(r.getPriority()))&&t.push(er(At(e)))}}function lr(n,e,t,s,i,r){const o=e.eventCache;if(Dt(s,t)!=null)return e;{let a,l;if(y(t))if(f(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const c=Ie(e),u=c instanceof _?c:_.EMPTY_NODE,h=Yn(s,u);a=n.filter.updateFullNode(e.eventCache.getNode(),h,r)}else{const c=Pt(s,Ie(e));a=n.filter.updateFullNode(e.eventCache.getNode(),c,r)}else{const c=g(t);if(c===".priority"){f(ce(t)===1,"Can't have a priority with additional path components");const u=o.getNode();l=e.serverCache.getNode();const h=Ys(s,t,u,l);h!=null?a=n.filter.updatePriority(u,h):a=o.getNode()}else{const u=I(t);let h;if(o.isCompleteForChild(c)){l=e.serverCache.getNode();const d=Ys(s,t,o.getNode(),l);d!=null?h=o.getNode().getImmediateChild(c).updateChild(u,d):h=o.getNode().getImmediateChild(c)}else h=Qn(s,c,e.serverCache);h!=null?a=n.filter.updateChild(o.getNode(),c,h,u,i,r):a=o.getNode()}}return Je(e,a,o.isFullyInitialized()||y(t),n.filter.filtersNodes())}}function Ot(n,e,t,s,i,r,o,a){const l=e.serverCache;let c;const u=o?n.filter:n.filter.getIndexedFilter();if(y(t))c=u.updateFullNode(l.getNode(),s,null);else if(u.filtersNodes()&&!l.isFiltered()){const p=l.getNode().updateChild(t,s);c=u.updateFullNode(l.getNode(),p,null)}else{const p=g(t);if(!l.isCompleteForPath(t)&&ce(t)>1)return e;const m=I(t),T=l.getNode().getImmediateChild(p).updateChild(m,s);p===".priority"?c=u.updatePriority(l.getNode(),T):c=u.updateChild(l.getNode(),p,T,m,ar,null)}const h=tr(e,c,l.isFullyInitialized()||y(t),u.filtersNodes()),d=new Jn(i,h,r);return lr(n,h,t,i,d,a)}function Rn(n,e,t,s,i,r,o){const a=e.eventCache;let l,c;const u=new Jn(i,e,r);if(y(t))c=n.filter.updateFullNode(e.eventCache.getNode(),s,o),l=Je(e,c,!0,n.filter.filtersNodes());else{const h=g(t);if(h===".priority")c=n.filter.updatePriority(e.eventCache.getNode(),s),l=Je(e,c,a.isFullyInitialized(),a.isFiltered());else{const d=I(t),p=a.getNode().getImmediateChild(h);let m;if(y(d))m=s;else{const C=u.getCompleteChild(h);C!=null?Wn(d)===".priority"&&C.getChild(qi(d)).isEmpty()?m=C:m=C.updateChild(d,s):m=_.EMPTY_NODE}if(p.equals(m))l=e;else{const C=n.filter.updateChild(a.getNode(),h,m,d,u,o);l=Je(e,C,a.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function Qs(n,e){return n.eventCache.isCompleteForChild(e)}function Oc(n,e,t,s,i,r,o){let a=e;return s.foreach((l,c)=>{const u=k(t,l);Qs(e,g(u))&&(a=Rn(n,a,u,c,i,r,o))}),s.foreach((l,c)=>{const u=k(t,l);Qs(e,g(u))||(a=Rn(n,a,u,c,i,r,o))}),a}function Js(n,e,t){return t.foreach((s,i)=>{e=e.updateChild(s,i)}),e}function kn(n,e,t,s,i,r,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,c;y(t)?c=s:c=new E(null).setTree(t,s);const u=e.serverCache.getNode();return c.children.inorderTraversal((h,d)=>{if(u.hasChild(h)){const p=e.serverCache.getNode().getImmediateChild(h),m=Js(n,p,d);l=Ot(n,l,new w(h),m,i,r,o,a)}}),c.children.inorderTraversal((h,d)=>{const p=!e.serverCache.isCompleteForChild(h)&&d.value===null;if(!u.hasChild(h)&&!p){const m=e.serverCache.getNode().getImmediateChild(h),C=Js(n,m,d);l=Ot(n,l,new w(h),C,i,r,o,a)}}),l}function Mc(n,e,t,s,i,r,o){if(Dt(i,t)!=null)return e;const a=e.serverCache.isFiltered(),l=e.serverCache;if(s.value!=null){if(y(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return Ot(n,e,t,l.getNode().getChild(t),i,r,a,o);if(y(t)){let c=new E(null);return l.getNode().forEachChild(Ae,(u,h)=>{c=c.set(new w(u),h)}),kn(n,e,t,c,i,r,a,o)}else return e}else{let c=new E(null);return s.foreach((u,h)=>{const d=k(t,u);l.isCompleteForPath(d)&&(c=c.set(u,l.getNode().getChild(d)))}),kn(n,e,t,c,i,r,a,o)}}function Lc(n,e,t,s,i){const r=e.serverCache,o=tr(e,r.getNode(),r.isFullyInitialized()||y(t),r.isFiltered());return lr(n,o,t,s,ar,i)}function Fc(n,e,t,s,i,r){let o;if(Dt(s,t)!=null)return e;{const a=new Jn(s,e,i),l=e.eventCache.getNode();let c;if(y(t)||g(t)===".priority"){let u;if(e.serverCache.isFullyInitialized())u=Pt(s,Ie(e));else{const h=e.serverCache.getNode();f(h instanceof _,"serverChildren would be complete if leaf node"),u=Yn(s,h)}u=u,c=n.filter.updateFullNode(l,u,r)}else{const u=g(t);let h=Qn(s,u,e.serverCache);h==null&&e.serverCache.isCompleteForChild(u)&&(h=l.getImmediateChild(u)),h!=null?c=n.filter.updateChild(l,u,h,I(t),a,r):e.eventCache.getNode().hasChild(u)?c=n.filter.updateChild(l,u,_.EMPTY_NODE,I(t),a,r):c=l,c.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=Pt(s,Ie(e)),o.isLeafNode()&&(c=n.filter.updateFullNode(c,o,r)))}return o=e.serverCache.isFullyInitialized()||Dt(s,b())!=null,Je(e,c,o,n.filter.filtersNodes())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bc{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const s=this.query_._queryParams,i=new zn(s.getIndex()),r=nc(s);this.processor_=Nc(r);const o=t.serverCache,a=t.eventCache,l=i.updateFullNode(_.EMPTY_NODE,o.getNode(),null),c=r.updateFullNode(_.EMPTY_NODE,a.getNode(),null),u=new he(l,o.isFullyInitialized(),i.filtersNodes()),h=new he(c,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=Gt(h,u),this.eventGenerator_=new cc(this.query_)}get query(){return this.query_}}function $c(n){return n.viewCache_.serverCache.getNode()}function Hc(n){return At(n.viewCache_)}function Wc(n,e){const t=Ie(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!y(e)&&!t.getImmediateChild(g(e)).isEmpty())?t.getChild(e):null}function Xs(n){return n.eventRegistrations_.length===0}function Uc(n,e){n.eventRegistrations_.push(e)}function Zs(n,e,t){const s=[];if(t){f(e==null,"A cancel should cancel all event registrations.");const i=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,i);o&&s.push(o)})}if(e){let i=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))i.push(o);else if(e.hasAnyCallback()){i=i.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=i}else n.eventRegistrations_=[];return s}function ei(n,e,t,s){e.type===G.MERGE&&e.source.queryId!==null&&(f(Ie(n.viewCache_),"We should always have a full cache before handling merges"),f(At(n.viewCache_),"Missing event cache, even though we have a server cache"));const i=n.viewCache_,r=Pc(n.processor_,i,e,t,s);return Ac(n.processor_,r.viewCache),f(r.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,cr(n,r.changes,r.viewCache.eventCache.getNode(),null)}function Gc(n,e){const t=n.viewCache_.eventCache,s=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(N,(r,o)=>{s.push(Me(r,o))}),t.isFullyInitialized()&&s.push(er(t.getNode())),cr(n,s,t.getNode(),e)}function cr(n,e,t,s){const i=s?[s]:n.eventRegistrations_;return hc(n.eventGenerator_,e,t,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Mt;class hr{constructor(){this.views=new Map}}function Vc(n){f(!Mt,"__referenceConstructor has already been defined"),Mt=n}function zc(){return f(Mt,"Reference.ts has not been loaded"),Mt}function jc(n){return n.views.size===0}function Xn(n,e,t,s){const i=e.source.queryId;if(i!==null){const r=n.views.get(i);return f(r!=null,"SyncTree gave us an op for an invalid query."),ei(r,e,t,s)}else{let r=[];for(const o of n.views.values())r=r.concat(ei(o,e,t,s));return r}}function dr(n,e,t,s,i){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let a=Pt(t,i?s:null),l=!1;a?l=!0:s instanceof _?(a=Yn(t,s),l=!1):(a=_.EMPTY_NODE,l=!1);const c=Gt(new he(a,l,!1),new he(s,i,!1));return new Bc(e,c)}return o}function qc(n,e,t,s,i,r){const o=dr(n,e,s,i,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),Uc(o,t),Gc(o,t)}function Kc(n,e,t,s){const i=e._queryIdentifier,r=[];let o=[];const a=de(n);if(i==="default")for(const[l,c]of n.views.entries())o=o.concat(Zs(c,t,s)),Xs(c)&&(n.views.delete(l),c.query._queryParams.loadsAllData()||r.push(c.query));else{const l=n.views.get(i);l&&(o=o.concat(Zs(l,t,s)),Xs(l)&&(n.views.delete(i),l.query._queryParams.loadsAllData()||r.push(l.query)))}return a&&!de(n)&&r.push(new(zc())(e._repo,e._path)),{removed:r,events:o}}function ur(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function le(n,e){let t=null;for(const s of n.views.values())t=t||Wc(s,e);return t}function fr(n,e){if(e._queryParams.loadsAllData())return zt(n);{const s=e._queryIdentifier;return n.views.get(s)}}function pr(n,e){return fr(n,e)!=null}function de(n){return zt(n)!=null}function zt(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Lt;function Yc(n){f(!Lt,"__referenceConstructor has already been defined"),Lt=n}function Qc(){return f(Lt,"Reference.ts has not been loaded"),Lt}let Jc=1;class ti{constructor(e){this.listenProvider_=e,this.syncPointTree_=new E(null),this.pendingWriteTree_=Tc(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function mr(n,e,t,s,i){return pc(n.pendingWriteTree_,e,t,s,i),i?Ue(n,new we(jn(),e,t)):[]}function Xc(n,e,t,s){mc(n.pendingWriteTree_,e,t,s);const i=E.fromObject(t);return Ue(n,new Le(jn(),e,i))}function se(n,e,t=!1){const s=_c(n.pendingWriteTree_,e);if(gc(n.pendingWriteTree_,e)){let r=new E(null);return s.snap!=null?r=r.set(b(),!0):L(s.children,o=>{r=r.set(new w(o),!0)}),Ue(n,new Nt(s.path,r,t))}else return[]}function pt(n,e,t){return Ue(n,new we(qn(),e,t))}function Zc(n,e,t){const s=E.fromObject(t);return Ue(n,new Le(qn(),e,s))}function eh(n,e){return Ue(n,new lt(qn(),e))}function th(n,e,t){const s=es(n,t);if(s){const i=ts(s),r=i.path,o=i.queryId,a=F(r,e),l=new lt(Kn(o),a);return ns(n,r,l)}else return[]}function Ft(n,e,t,s,i=!1){const r=e._path,o=n.syncPointTree_.get(r);let a=[];if(o&&(e._queryIdentifier==="default"||pr(o,e))){const l=Kc(o,e,t,s);jc(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const c=l.removed;if(a=l.events,!i){const u=c.findIndex(d=>d._queryParams.loadsAllData())!==-1,h=n.syncPointTree_.findOnPath(r,(d,p)=>de(p));if(u&&!h){const d=n.syncPointTree_.subtree(r);if(!d.isEmpty()){const p=ih(d);for(let m=0;m<p.length;++m){const C=p[m],T=C.query,Y=vr(n,C);n.listenProvider_.startListening(Ze(T),ct(n,T),Y.hashFn,Y.onComplete)}}}!h&&c.length>0&&!s&&(u?n.listenProvider_.stopListening(Ze(e),null):c.forEach(d=>{const p=n.queryToTagMap.get(jt(d));n.listenProvider_.stopListening(Ze(d),p)}))}rh(n,c)}return a}function _r(n,e,t,s){const i=es(n,s);if(i!=null){const r=ts(i),o=r.path,a=r.queryId,l=F(o,e),c=new we(Kn(a),l,t);return ns(n,o,c)}else return[]}function nh(n,e,t,s){const i=es(n,s);if(i){const r=ts(i),o=r.path,a=r.queryId,l=F(o,e),c=E.fromObject(t),u=new Le(Kn(a),l,c);return ns(n,o,u)}else return[]}function Nn(n,e,t,s=!1){const i=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(i,(d,p)=>{const m=F(d,i);r=r||le(p,m),o=o||de(p)});let a=n.syncPointTree_.get(i);a?(o=o||de(a),r=r||le(a,b())):(a=new hr,n.syncPointTree_=n.syncPointTree_.set(i,a));let l;r!=null?l=!0:(l=!1,r=_.EMPTY_NODE,n.syncPointTree_.subtree(i).foreachChild((p,m)=>{const C=le(m,b());C&&(r=r.updateImmediateChild(p,C))}));const c=pr(a,e);if(!c&&!e._queryParams.loadsAllData()){const d=jt(e);f(!n.queryToTagMap.has(d),"View does not exist, but we have a tag");const p=oh();n.queryToTagMap.set(d,p),n.tagToQueryMap.set(p,d)}const u=Vt(n.pendingWriteTree_,i);let h=qc(a,e,t,u,r,l);if(!c&&!o&&!s){const d=fr(a,e);h=h.concat(ah(n,e,d))}return h}function Zn(n,e,t){const i=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,a)=>{const l=F(o,e),c=le(a,l);if(c)return c});return ir(i,e,r,t,!0)}function sh(n,e){const t=e._path;let s=null;n.syncPointTree_.foreachOnPath(t,(c,u)=>{const h=F(c,t);s=s||le(u,h)});let i=n.syncPointTree_.get(t);i?s=s||le(i,b()):(i=new hr,n.syncPointTree_=n.syncPointTree_.set(t,i));const r=s!=null,o=r?new he(s,!0,!1):null,a=Vt(n.pendingWriteTree_,e._path),l=dr(i,e,a,r?o.getNode():_.EMPTY_NODE,r);return Hc(l)}function Ue(n,e){return gr(e,n.syncPointTree_,null,Vt(n.pendingWriteTree_,b()))}function gr(n,e,t,s){if(y(n.path))return yr(n,e,t,s);{const i=e.get(b());t==null&&i!=null&&(t=le(i,b()));let r=[];const o=g(n.path),a=n.operationForChild(o),l=e.children.get(o);if(l&&a){const c=t?t.getImmediateChild(o):null,u=rr(s,o);r=r.concat(gr(a,l,c,u))}return i&&(r=r.concat(Xn(i,n,s,t))),r}}function yr(n,e,t,s){const i=e.get(b());t==null&&i!=null&&(t=le(i,b()));let r=[];return e.children.inorderTraversal((o,a)=>{const l=t?t.getImmediateChild(o):null,c=rr(s,o),u=n.operationForChild(o);u&&(r=r.concat(yr(u,a,l,c)))}),i&&(r=r.concat(Xn(i,n,s,t))),r}function vr(n,e){const t=e.query,s=ct(n,t);return{hashFn:()=>($c(e)||_.EMPTY_NODE).hash(),onComplete:i=>{if(i==="ok")return s?th(n,t._path,s):eh(n,t._path);{const r=el(i,t);return Ft(n,t,null,r)}}}}function ct(n,e){const t=jt(e);return n.queryToTagMap.get(t)}function jt(n){return n._path.toString()+"$"+n._queryIdentifier}function es(n,e){return n.tagToQueryMap.get(e)}function ts(n){const e=n.indexOf("$");return f(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new w(n.substr(0,e))}}function ns(n,e,t){const s=n.syncPointTree_.get(e);f(s,"Missing sync point for query tag that we're tracking");const i=Vt(n.pendingWriteTree_,e);return Xn(s,t,i,null)}function ih(n){return n.fold((e,t,s)=>{if(t&&de(t))return[zt(t)];{let i=[];return t&&(i=ur(t)),L(s,(r,o)=>{i=i.concat(o)}),i}})}function Ze(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(Qc())(n._repo,n._path):n}function rh(n,e){for(let t=0;t<e.length;++t){const s=e[t];if(!s._queryParams.loadsAllData()){const i=jt(s),r=n.queryToTagMap.get(i);n.queryToTagMap.delete(i),n.tagToQueryMap.delete(r)}}}function oh(){return Jc++}function ah(n,e,t){const s=e._path,i=ct(n,e),r=vr(n,t),o=n.listenProvider_.startListening(Ze(e),i,r.hashFn,r.onComplete),a=n.syncPointTree_.subtree(s);if(i)f(!de(a.value),"If we're adding a query, it shouldn't be shadowed");else{const l=a.fold((c,u,h)=>{if(!y(c)&&u&&de(u))return[zt(u).query];{let d=[];return u&&(d=d.concat(ur(u).map(p=>p.query))),L(h,(p,m)=>{d=d.concat(m)}),d}});for(let c=0;c<l.length;++c){const u=l[c];n.listenProvider_.stopListening(Ze(u),ct(n,u))}}return o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ss{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new ss(t)}node(){return this.node_}}class is{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=k(this.path_,e);return new is(this.syncTree_,t)}node(){return Zn(this.syncTree_,this.path_)}}const lh=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},ni=function(n,e,t){if(!n||typeof n!="object")return n;if(f(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return ch(n[".sv"],e,t);if(typeof n[".sv"]=="object")return hh(n[".sv"],e);f(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},ch=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:f(!1,"Unexpected server value: "+n)}},hh=function(n,e,t){n.hasOwnProperty("increment")||f(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&f(!1,"Unexpected increment value: "+s);const i=e.node();if(f(i!==null&&typeof i<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!i.isLeafNode())return s;const o=i.getValue();return typeof o!="number"?s:o+s},Cr=function(n,e,t,s){return rs(e,new is(t,n),s)},br=function(n,e,t){return rs(n,new ss(e),t)};function rs(n,e,t){const s=n.getPriority().val(),i=ni(s,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,a=ni(o.getValue(),e,t);return a!==o.getValue()||i!==o.getPriority().val()?new D(a,A(i)):n}else{const o=n;return r=o,i!==o.getPriority().val()&&(r=r.updatePriority(new D(i))),o.forEachChild(N,(a,l)=>{const c=rs(l,e.getImmediateChild(a),t);c!==l&&(r=r.updateImmediateChild(a,c))}),r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class os{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function as(n,e){let t=e instanceof w?e:new w(e),s=n,i=g(t);for(;i!==null;){const r=Pe(s.node.children,i)||{children:{},childCount:0};s=new os(i,s,r),t=I(t),i=g(t)}return s}function Ge(n){return n.node.value}function wr(n,e){n.node.value=e,An(n)}function Ir(n){return n.node.childCount>0}function dh(n){return Ge(n)===void 0&&!Ir(n)}function qt(n,e){L(n.node.children,(t,s)=>{e(new os(t,n,s))})}function Er(n,e,t,s){t&&e(n),qt(n,i=>{Er(i,e,!0)})}function uh(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function mt(n){return new w(n.parent===null?n.name:mt(n.parent)+"/"+n.name)}function An(n){n.parent!==null&&fh(n.parent,n.name,n)}function fh(n,e,t){const s=dh(t),i=K(n.node.children,e);s&&i?(delete n.node.children[e],n.node.childCount--,An(n)):!s&&!i&&(n.node.children[e]=t.node,n.node.childCount++,An(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ph=/[\[\].#$\/\u0000-\u001F\u007F]/,mh=/[\[\].#$\u0000-\u001F\u007F]/,dn=10*1024*1024,ls=function(n){return typeof n=="string"&&n.length!==0&&!ph.test(n)},Sr=function(n){return typeof n=="string"&&n.length!==0&&!mh.test(n)},_h=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Sr(n)},Tr=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!Ht(n)||n&&typeof n=="object"&&K(n,".sv")},Bt=function(n,e,t,s){s&&e===void 0||Kt(De(n,"value"),e,t)},Kt=function(n,e,t){const s=t instanceof w?new Ol(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+_e(s));if(typeof e=="function")throw new Error(n+"contains a function "+_e(s)+" with contents = "+e.toString());if(Ht(e))throw new Error(n+"contains "+e.toString()+" "+_e(s));if(typeof e=="string"&&e.length>dn/3&&$t(e)>dn)throw new Error(n+"contains a string greater than "+dn+" utf8 bytes "+_e(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let i=!1,r=!1;if(L(e,(o,a)=>{if(o===".value")i=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!ls(o)))throw new Error(n+" contains an invalid key ("+o+") "+_e(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);Ml(s,o),Kt(n,a,s),Ll(s)}),i&&r)throw new Error(n+' contains ".value" child '+_e(s)+" in addition to actual children.")}},gh=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const r=it(s);for(let o=0;o<r.length;o++)if(!(r[o]===".priority"&&o===r.length-1)){if(!ls(r[o]))throw new Error(n+"contains an invalid key ("+r[o]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(Dl);let i=null;for(t=0;t<e.length;t++){if(s=e[t],i!==null&&H(i,s))throw new Error(n+"contains a path "+i.toString()+" that is ancestor of another path "+s.toString());i=s}},xr=function(n,e,t,s){const i=De(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(i+" must be an object containing the children to replace.");const r=[];L(e,(o,a)=>{const l=new w(o);if(Kt(i,a,k(t,l)),Wn(l)===".priority"&&!Tr(a))throw new Error(i+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");r.push(l)}),gh(i,r)},yh=function(n,e,t){if(Ht(e))throw new Error(De(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!Tr(e))throw new Error(De(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},cs=function(n,e,t,s){if(!Sr(t))throw new Error(De(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},vh=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),cs(n,e,t)},ie=function(n,e){if(g(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},Ch=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!ls(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!_h(t))throw new Error(De(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bh{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Yt(n,e){let t=null;for(let s=0;s<e.length;s++){const i=e[s],r=i.getPath();t!==null&&!Un(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(i)}t&&n.eventLists_.push(t)}function Rr(n,e,t){Yt(n,t),kr(n,s=>Un(s,e))}function W(n,e,t){Yt(n,t),kr(n,s=>H(s,e)||H(e,s))}function kr(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const i=n.eventLists_[s];if(i){const r=i.path;e(r)?(wh(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function wh(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();Ye&&M("event: "+t.toString()),He(s)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ih="repo_interrupt",Eh=25;class Sh{constructor(e,t,s,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new bh,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=kt(),this.transactionQueueTree_=new os,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Th(n,e,t){if(n.stats_=$n(n.repoInfo_),n.forceRestClient_||il())n.server_=new Rt(n.repoInfo_,(s,i,r,o)=>{si(n,s,i,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>ii(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{P(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new X(n.repoInfo_,e,(s,i,r,o)=>{si(n,s,i,r,o)},s=>{ii(n,s)},s=>{xh(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=cl(n.repoInfo_,()=>new lc(n.stats_,n.server_)),n.infoData_=new sc,n.infoSyncTree_=new ti({startListening:(s,i,r,o)=>{let a=[];const l=n.infoData_.getNode(s._path);return l.isEmpty()||(a=pt(n.infoSyncTree_,s._path,l),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),hs(n,"connected",!1),n.serverSyncTree_=new ti({startListening:(s,i,r,o)=>(n.server_.listen(s,r,i,(a,l)=>{const c=o(a,l);W(n.eventQueue_,s._path,c)}),[]),stopListening:(s,i)=>{n.server_.unlisten(s,i)}})}function Nr(n){const t=n.infoData_.getNode(new w(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Qt(n){return lh({timestamp:Nr(n)})}function si(n,e,t,s,i){n.dataUpdateCount++;const r=new w(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(i)if(s){const l=bt(t,c=>A(c));o=nh(n.serverSyncTree_,r,l,i)}else{const l=A(t);o=_r(n.serverSyncTree_,r,l,i)}else if(s){const l=bt(t,c=>A(c));o=Zc(n.serverSyncTree_,r,l)}else{const l=A(t);o=pt(n.serverSyncTree_,r,l)}let a=r;o.length>0&&(a=Be(n,r)),W(n.eventQueue_,a,o)}function ii(n,e){hs(n,"connected",e),e===!1&&Ah(n)}function xh(n,e){L(e,(t,s)=>{hs(n,t,s)})}function hs(n,e,t){const s=new w("/.info/"+e),i=A(t);n.infoData_.updateSnapshot(s,i);const r=pt(n.infoSyncTree_,s,i);W(n.eventQueue_,s,r)}function ds(n){return n.nextWriteId_++}function Rh(n,e,t){const s=sh(n.serverSyncTree_,e);return s!=null?Promise.resolve(s):n.server_.get(e).then(i=>{const r=A(i).withIndex(e._queryParams.getIndex());Nn(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=pt(n.serverSyncTree_,e._path,r);else{const a=ct(n.serverSyncTree_,e);o=_r(n.serverSyncTree_,e._path,r,a)}return W(n.eventQueue_,e._path,o),Ft(n.serverSyncTree_,e,t,null,!0),r},i=>(_t(n,"get for query "+P(e)+" failed: "+i),Promise.reject(new Error(i))))}function kh(n,e,t,s,i){_t(n,"set",{path:e.toString(),value:t,priority:s});const r=Qt(n),o=A(t,s),a=Zn(n.serverSyncTree_,e),l=br(o,a,r),c=ds(n),u=mr(n.serverSyncTree_,e,l,c,!0);Yt(n.eventQueue_,u),n.server_.put(e.toString(),o.val(!0),(d,p)=>{const m=d==="ok";m||B("set at "+e+" failed: "+d);const C=se(n.serverSyncTree_,c,!m);W(n.eventQueue_,e,C),ue(n,i,d,p)});const h=fs(n,e);Be(n,h),W(n.eventQueue_,h,[])}function Nh(n,e,t,s){_t(n,"update",{path:e.toString(),value:t});let i=!0;const r=Qt(n),o={};if(L(t,(a,l)=>{i=!1,o[a]=Cr(k(e,a),A(l),n.serverSyncTree_,r)}),i)M("update() called with empty data.  Don't do anything."),ue(n,s,"ok",void 0);else{const a=ds(n),l=Xc(n.serverSyncTree_,e,o,a);Yt(n.eventQueue_,l),n.server_.merge(e.toString(),t,(c,u)=>{const h=c==="ok";h||B("update at "+e+" failed: "+c);const d=se(n.serverSyncTree_,a,!h),p=d.length>0?Be(n,e):e;W(n.eventQueue_,p,d),ue(n,s,c,u)}),L(t,c=>{const u=fs(n,k(e,c));Be(n,u)}),W(n.eventQueue_,e,[])}}function Ah(n){_t(n,"onDisconnectEvents");const e=Qt(n),t=kt();En(n.onDisconnect_,b(),(i,r)=>{const o=Cr(i,r,n.serverSyncTree_,e);We(t,i,o)});let s=[];En(t,b(),(i,r)=>{s=s.concat(pt(n.serverSyncTree_,i,r));const o=fs(n,i);Be(n,o)}),n.onDisconnect_=kt(),W(n.eventQueue_,b(),s)}function Ph(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,i)=>{s==="ok"&&In(n.onDisconnect_,e),ue(n,t,s,i)})}function ri(n,e,t,s){const i=A(t);n.server_.onDisconnectPut(e.toString(),i.val(!0),(r,o)=>{r==="ok"&&We(n.onDisconnect_,e,i),ue(n,s,r,o)})}function Dh(n,e,t,s,i){const r=A(t,s);n.server_.onDisconnectPut(e.toString(),r.val(!0),(o,a)=>{o==="ok"&&We(n.onDisconnect_,e,r),ue(n,i,o,a)})}function Oh(n,e,t,s){if(pn(t)){M("onDisconnect().update() called with empty data.  Don't do anything."),ue(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(i,r)=>{i==="ok"&&L(t,(o,a)=>{const l=A(a);We(n.onDisconnect_,k(e,o),l)}),ue(n,s,i,r)})}function Mh(n,e,t){let s;g(e._path)===".info"?s=Nn(n.infoSyncTree_,e,t):s=Nn(n.serverSyncTree_,e,t),Rr(n.eventQueue_,e._path,s)}function Lh(n,e,t){let s;g(e._path)===".info"?s=Ft(n.infoSyncTree_,e,t):s=Ft(n.serverSyncTree_,e,t),Rr(n.eventQueue_,e._path,s)}function Fh(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Ih)}function _t(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),M(t,...e)}function ue(n,e,t,s){e&&He(()=>{if(t==="ok")e(null);else{const i=(t||"error").toUpperCase();let r=i;s&&(r+=": "+s);const o=new Error(r);o.code=i,e(o)}})}function Ar(n,e,t){return Zn(n.serverSyncTree_,e,t)||_.EMPTY_NODE}function us(n,e=n.transactionQueueTree_){if(e||Jt(n,e),Ge(e)){const t=Dr(n,e);f(t.length>0,"Sending zero length transaction queue"),t.every(i=>i.status===0)&&Bh(n,mt(e),t)}else Ir(e)&&qt(e,t=>{us(n,t)})}function Bh(n,e,t){const s=t.map(c=>c.currentWriteId),i=Ar(n,e,s);let r=i;const o=i.hash();for(let c=0;c<t.length;c++){const u=t[c];f(u.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),u.status=1,u.retryCount++;const h=F(e,u.path);r=r.updateChild(h,u.currentOutputSnapshotRaw)}const a=r.val(!0),l=e;n.server_.put(l.toString(),a,c=>{_t(n,"transaction put response",{path:l.toString(),status:c});let u=[];if(c==="ok"){const h=[];for(let d=0;d<t.length;d++)t[d].status=2,u=u.concat(se(n.serverSyncTree_,t[d].currentWriteId)),t[d].onComplete&&h.push(()=>t[d].onComplete(null,!0,t[d].currentOutputSnapshotResolved)),t[d].unwatcher();Jt(n,as(n.transactionQueueTree_,e)),us(n,n.transactionQueueTree_),W(n.eventQueue_,e,u);for(let d=0;d<h.length;d++)He(h[d])}else{if(c==="datastale")for(let h=0;h<t.length;h++)t[h].status===3?t[h].status=4:t[h].status=0;else{B("transaction at "+l.toString()+" failed: "+c);for(let h=0;h<t.length;h++)t[h].status=4,t[h].abortReason=c}Be(n,e)}},o)}function Be(n,e){const t=Pr(n,e),s=mt(t),i=Dr(n,t);return $h(n,i,s),s}function $h(n,e,t){if(e.length===0)return;const s=[];let i=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const l=e[a],c=F(t,l.path);let u=!1,h;if(f(c!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)u=!0,h=l.abortReason,i=i.concat(se(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=Eh)u=!0,h="maxretry",i=i.concat(se(n.serverSyncTree_,l.currentWriteId,!0));else{const d=Ar(n,l.path,o);l.currentInputSnapshot=d;const p=e[a].update(d.val());if(p!==void 0){Kt("transaction failed: Data returned ",p,l.path);let m=A(p);typeof p=="object"&&p!=null&&K(p,".priority")||(m=m.updatePriority(d.getPriority()));const T=l.currentWriteId,Y=Qt(n),Q=br(m,d,Y);l.currentOutputSnapshotRaw=m,l.currentOutputSnapshotResolved=Q,l.currentWriteId=ds(n),o.splice(o.indexOf(T),1),i=i.concat(mr(n.serverSyncTree_,l.path,Q,l.currentWriteId,l.applyLocally)),i=i.concat(se(n.serverSyncTree_,T,!0))}else u=!0,h="nodata",i=i.concat(se(n.serverSyncTree_,l.currentWriteId,!0))}W(n.eventQueue_,t,i),i=[],u&&(e[a].status=2,(function(d){setTimeout(d,Math.floor(0))})(e[a].unwatcher),e[a].onComplete&&(h==="nodata"?s.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):s.push(()=>e[a].onComplete(new Error(h),!1,null))))}Jt(n,n.transactionQueueTree_);for(let a=0;a<s.length;a++)He(s[a]);us(n,n.transactionQueueTree_)}function Pr(n,e){let t,s=n.transactionQueueTree_;for(t=g(e);t!==null&&Ge(s)===void 0;)s=as(s,t),e=I(e),t=g(e);return s}function Dr(n,e){const t=[];return Or(n,e,t),t.sort((s,i)=>s.order-i.order),t}function Or(n,e,t){const s=Ge(e);if(s)for(let i=0;i<s.length;i++)t.push(s[i]);qt(e,i=>{Or(n,i,t)})}function Jt(n,e){const t=Ge(e);if(t){let s=0;for(let i=0;i<t.length;i++)t[i].status!==2&&(t[s]=t[i],s++);t.length=s,wr(e,t.length>0?t:void 0)}qt(e,s=>{Jt(n,s)})}function fs(n,e){const t=mt(Pr(n,e)),s=as(n.transactionQueueTree_,e);return uh(s,i=>{un(n,i)}),un(n,s),Er(s,i=>{un(n,i)}),t}function un(n,e){const t=Ge(e);if(t){const s=[];let i=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(f(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(f(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),i=i.concat(se(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&s.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?wr(e,void 0):t.length=r+1,W(n.eventQueue_,mt(e),i);for(let o=0;o<s.length;o++)He(s[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hh(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let i=t[s];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch{}e+="/"+i}return e}function Wh(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):B(`Invalid query segment '${t}' in query '${n}'`)}return e}const oi=function(n,e){const t=Uh(n),s=t.namespace;t.domain==="firebase.com"&&ee(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&ee("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||Ya();const i=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Bi(t.host,t.secure,s,i,e,"",s!==t.subdomain),path:new w(t.pathString)}},Uh=function(n){let e="",t="",s="",i="",r="",o=!0,a="https",l=443;if(typeof n=="string"){let c=n.indexOf("//");c>=0&&(a=n.substring(0,c-1),n=n.substring(c+2));let u=n.indexOf("/");u===-1&&(u=n.length);let h=n.indexOf("?");h===-1&&(h=n.length),e=n.substring(0,Math.min(u,h)),u<h&&(i=Hh(n.substring(u,h)));const d=Wh(n.substring(Math.min(n.length,h)));c=e.indexOf(":"),c>=0?(o=a==="https"||a==="wss",l=parseInt(e.substring(c+1),10)):c=e.length;const p=e.slice(0,c);if(p.toLowerCase()==="localhost")t="localhost";else if(p.split(".").length<=2)t=p;else{const m=e.indexOf(".");s=e.substring(0,m).toLowerCase(),t=e.substring(m+1),r=s}"ns"in d&&(r=d.ns)}return{host:e,port:l,domain:t,subdomain:s,secure:o,scheme:a,pathString:i,namespace:r}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ai="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",Gh=(function(){let n=0;const e=[];return function(t){const s=t===n;n=t;let i;const r=new Array(8);for(i=7;i>=0;i--)r[i]=ai.charAt(t%64),t=Math.floor(t/64);f(t===0,"Cannot push at time == 0");let o=r.join("");if(s){for(i=11;i>=0&&e[i]===63;i--)e[i]=0;e[i]++}else for(i=0;i<12;i++)e[i]=Math.floor(Math.random()*64);for(i=0;i<12;i++)o+=ai.charAt(e[i]);return f(o.length===20,"nextPushId: Length should be 20."),o}})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mr{constructor(e,t,s,i){this.eventType=e,this.eventRegistration=t,this.snapshot=s,this.prevName=i}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+P(this.snapshot.exportVal())}}class Lr{constructor(e,t,s){this.eventRegistration=e,this.error=t,this.path=s}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fr{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return f(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Br{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new j;return Ph(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){ie("OnDisconnect.remove",this._path);const e=new j;return ri(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){ie("OnDisconnect.set",this._path),Bt("OnDisconnect.set",e,this._path,!1);const t=new j;return ri(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){ie("OnDisconnect.setWithPriority",this._path),Bt("OnDisconnect.setWithPriority",e,this._path,!1),yh("OnDisconnect.setWithPriority",t);const s=new j;return Dh(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){ie("OnDisconnect.update",this._path),xr("OnDisconnect.update",e,this._path);const t=new j;return Oh(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xt{constructor(e,t,s,i){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=i}get key(){return y(this._path)?null:Wn(this._path)}get ref(){return new z(this._repo,this._path)}get _queryIdentifier(){const e=zs(this._queryParams),t=Fn(e);return t==="{}"?"default":t}get _queryObject(){return zs(this._queryParams)}isEqual(e){if(e=fe(e),!(e instanceof Xt))return!1;const t=this._repo===e._repo,s=Un(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&s&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+Pl(this._path)}}class z extends Xt{constructor(e,t){super(e,t,new Ut,!1)}get parent(){const e=qi(this._path);return e===null?null:new z(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class Ee{constructor(e,t,s){this._node=e,this.ref=t,this._index=s}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new w(e),s=q(this.ref,e);return new Ee(this._node.getChild(t),s,N)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(s,i)=>e(new Ee(i,q(this.ref,s),N)))}hasChild(e){const t=new w(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function x(n,e){return n=fe(n),n._checkNotDeleted("ref"),e!==void 0?q(n._root,e):n._root}function q(n,e){return n=fe(n),g(n._path)===null?vh("child","path",e):cs("child","path",e),new z(n._repo,k(n._path,e))}function Pn(n){return n=fe(n),new Br(n._repo,n._path)}function $r(n,e){n=fe(n),ie("push",n._path),Bt("push",e,n._path,!0);const t=Nr(n._repo),s=Gh(t),i=q(n,s),r=q(n,s);let o;return o=Promise.resolve(r),i.then=o.then.bind(o),i.catch=o.then.bind(o,void 0),i}function Hr(n){return ie("remove",n._path),ve(n,null)}function ve(n,e){n=fe(n),ie("set",n._path),Bt("set",e,n._path,!1);const t=new j;return kh(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function ne(n,e){xr("update",e,n._path);const t=new j;return Nh(n._repo,n._path,e,t.wrapCallback(()=>{})),t.promise}function ge(n){n=fe(n);const e=new Fr(()=>{}),t=new Zt(e);return Rh(n._repo,n,t).then(s=>new Ee(s,new z(n._repo,n._path),n._queryParams.getIndex()))}class Zt{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const s=t._queryParams.getIndex();return new Mr("value",this,new Ee(e.snapshotNode,new z(t._repo,t._path),s))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Lr(this,e,t):null}matches(e){return e instanceof Zt?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}class ps{constructor(e,t){this.eventType=e,this.callbackContext=t}respondsTo(e){let t=e==="children_added"?"child_added":e;return t=t==="children_removed"?"child_removed":t,this.eventType===t}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Lr(this,e,t):null}createEvent(e,t){f(e.childName!=null,"Child events should have a childName.");const s=q(new z(t._repo,t._path),e.childName),i=t._queryParams.getIndex();return new Mr(e.type,this,new Ee(e.snapshotNode,s,i),e.prevName)}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,e.prevName)}matches(e){return e instanceof ps?this.eventType===e.eventType&&(!this.callbackContext||!e.callbackContext||this.callbackContext.matches(e.callbackContext)):!1}hasAnyCallback(){return!!this.callbackContext}}function Wr(n,e,t,s,i){const r=new Fr(t,void 0),o=e==="value"?new Zt(r):new ps(e,r);return Mh(n._repo,n,o),()=>Lh(n._repo,n,o)}function ye(n,e,t,s){return Wr(n,"value",e)}function Ur(n,e,t,s){return Wr(n,"child_added",e)}Vc(z);Yc(z);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vh="FIREBASE_DATABASE_EMULATOR_HOST",Dn={};let zh=!1;function jh(n,e,t,s){const i=e.lastIndexOf(":"),r=e.substring(0,i),o=Mn(r);n.repoInfo_=new Bi(e,o,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0,t),s&&(n.authTokenProvider_=s)}function Gr(n,e,t,s,i){let r=s||n.options.databaseURL;r===void 0&&(n.options.projectId||ee("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),M("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=oi(r,i),a=o.repoInfo,l;typeof process<"u"&&xs&&(l=xs[Vh]),l?(r=`http://${l}?ns=${a.namespace}`,o=oi(r,i),a=o.repoInfo):o.repoInfo.secure;const c=new ol(n.name,n.options,e);Ch("Invalid Firebase Database URL",o),y(o.path)||ee("Database URL must point to the root of a Firebase Database (not including a child path).");const u=Kh(a,n,c,new rl(n,t));return new Vr(u,n)}function qh(n,e){const t=Dn[e];(!t||t[n.key]!==n)&&ee(`Database ${e}(${n.repoInfo_}) has already been deleted.`),Fh(n),delete t[n.key]}function Kh(n,e,t,s){let i=Dn[e.name];i||(i={},Dn[e.name]=i);let r=i[n.toURLString()];return r&&ee("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Sh(n,zh,t,s),i[n.toURLString()]=r,r}class Vr{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Th(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new z(this._repo,b())),this._rootInternal}_delete(){return this._rootInternal!==null&&(qh(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&ee("Cannot call "+e+" on a deleted database.")}}function zr(n=Aa(),e){const t=Ta(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const s=ho("database");s&&jr(t,...s)}return t}function jr(n,e,t,s={}){n=fe(n),n._checkNotDeleted("useEmulator");const i=`${e}:${t}`,r=n._repoInternal;if(n._instanceStarted){if(i===n._repoInternal.repoInfo_.host&&wt(s,r.repoInfo_.emulatorOptions))return;ee("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let o;if(r.repoInfo_.nodeAdmin)s.mockUserToken&&ee('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),o=new vt(vt.OWNER);else if(s.mockUserToken){const a=typeof s.mockUserToken=="string"?s.mockUserToken:fo(s.mockUserToken,n.app.options.projectId);o=new vt(a)}Mn(e)&&(uo(e),_o("Database",!0)),jh(r,i,s,o)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yh(n){Ei(Na),Et(new tt("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return Gr(s,i,r,t)},"PUBLIC").setMultipleInstances(!0)),ke(Rs,ks,n),ke(Rs,ks,"esm2020")}X.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};X.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};Yh();const Qh=Object.freeze(Object.defineProperty({__proto__:null,DataSnapshot:Ee,Database:Vr,OnDisconnect:Br,_QueryImpl:Xt,_QueryParams:Ut,_ReferenceImpl:z,_repoManagerDatabaseFromApp:Gr,_setSDKVersion:Ei,_validatePathString:cs,_validateWritablePath:ie,child:q,connectDatabaseEmulator:jr,get:ge,getDatabase:zr,onChildAdded:Ur,onDisconnect:Pn,onValue:ye,push:$r,ref:x,remove:Hr,set:ve,update:ne},Symbol.toStringTag,{value:"Module"})),Jh={apiKey:"AIzaSyDApOxz17VTsot6Ph5sVMDOJCflc1_lE7o",authDomain:"may-be-goita-online.firebaseapp.com",databaseURL:"https://may-be-goita-online-default-rtdb.firebaseio.com",projectId:"may-be-goita-online",storageBucket:"may-be-goita-online.firebasestorage.app",messagingSenderId:"774407878648",appId:"1:774407878648:web:a5014459d8ba834c4cc80d"};class Xh{constructor(){try{this.app=Ci(Jh),this.db=zr(this.app),this.initialized=!0}catch(e){console.error("Firebase Init Error:",e),this.initialized=!1}this.playerId=this.getPlayerId(),this.playerName="Player",this.currentRoomId=null,this.isHost=!1,this.roomRef=null,this.onRoomUpdate=null,this.onGameStart=null}getPlayerId(){let e=sessionStorage.getItem("goita_playerId");return e||(e="user_"+Math.random().toString(36).substr(2,9),sessionStorage.setItem("goita_playerId",e)),e}resetPlayerId(){return sessionStorage.removeItem("goita_playerId"),this.playerId=this.getPlayerId(),console.log("Player ID Reset:",this.playerId),this.playerId}generateRoomCode(){const e="あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";let t="";for(let s=0;s<4;s++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}async createRoom(e){if(!this.initialized)return{success:!1,error:"Firebase not configured"};this.playerName=e,this.isHost=!0;const t=this.generateRoomCode();this.currentRoomId=t;const s={hostId:this.playerId,status:"waiting",players:{[this.playerId]:{name:e,id:this.playerId,index:0,isHost:!0,isReady:!0}},settings:{mode:"standard"}};try{return this.roomRef=x(this.db,"rooms/"+t),await ve(this.roomRef,s),Pn(this.roomRef).remove(),this.listenToRoom(),{success:!0,code:t}}catch(i){return console.error(i),{success:!1,error:i.message}}}async joinRoom(e,t){if(!this.initialized)return{success:!1,error:"Firebase not configured"};this.playerName=t,this.isHost=!1,this.currentRoomId=e;const s=x(this.db,"rooms/"+e);try{const i=await ge(s);if(!i.exists())return{success:!1,error:"部屋が見つかりません"};const r=i.val();r.status!=="waiting"&&r.status;const o=r.players||{};let a=-1;if(o[this.playerId])a=o[this.playerId].index,console.log("Rejoining as Player",a);else{if(Object.keys(o).length>=4)return{success:!1,error:"部屋は満員です"};if(r.status!=="waiting")return{success:!1,error:"ゲームは既に始まっています"};const u=Object.values(o).map(h=>h.index);for(let h=0;h<4;h++)if(!u.includes(h)){a=h;break}}const l={name:t,id:this.playerId,index:a,isHost:!1,isReady:!0};return await ne(x(this.db,`rooms/${e}/players/${this.playerId}`),l),Pn(x(this.db,`rooms/${e}/players/${this.playerId}`)).remove(),this.listenToRoom(),{success:!0,index:a}}catch(i){return console.error(i),{success:!1,error:i.message}}}listenToRoom(){if(!this.currentRoomId)return;const e=x(this.db,"rooms/"+this.currentRoomId);ye(e,t=>{const s=t.val();s?(this.onRoomUpdate&&this.onRoomUpdate(s),s.status==="playing"&&this.onGameStart&&(this.gameStarted||(this.gameStarted=!0,this.onGameStart()))):this.onRoomUpdate&&this.onRoomUpdate(null)})}async startGame(){if(!this.isHost||!this.currentRoomId)return;const e=x(this.db,"rooms/"+this.currentRoomId),t=await ge(e);if(!t.exists())return;const i=t.val().players||{},r=Object.values(i).map(a=>a.index),o={};for(let a=0;a<4;a++)if(!r.includes(a)){const l=`cpu_${Date.now()}_${a}`;o[`players/${l}`]={name:`CPU ${a}`,id:l,index:a,isHost:!1,isReady:!0,isCpu:!0}}Object.keys(o).length>0&&await ne(e,o),await Hr(x(this.db,`rooms/${this.currentRoomId}/actions`)),await ne(e,{status:"playing"})}async resetRoom(){if(!this.isHost||!this.currentRoomId)return;const e={};e[`rooms/${this.currentRoomId}/status`]="waiting",e[`rooms/${this.currentRoomId}/gameState`]=null,e[`rooms/${this.currentRoomId}/actions`]=null;const s=(await ge(x(this.db,`rooms/${this.currentRoomId}/players`))).val()||{};Object.keys(s).forEach(i=>{e[`rooms/${this.currentRoomId}/players/${i}/isReadyForNextRound`]=!1}),await ne(x(this.db),e)}async setInitialState(e){this.currentRoomId&&await ve(x(this.db,`rooms/${this.currentRoomId}/gameState`),e)}subscribeToInitialState(e){if(!this.currentRoomId)return;const t=x(this.db,`rooms/${this.currentRoomId}/gameState`);ye(t,s=>{const i=s.val();i&&e(i)})}async sendGameAction(e){if(!this.currentRoomId)return;const t=$r(x(this.db,`rooms/${this.currentRoomId}/actions`));await ve(t,{...e,playerId:this.playerId,timestamp:Date.now()})}async getGameState(){return this.currentRoomId?(await ge(x(this.db,`rooms/${this.currentRoomId}/gameState`))).val():null}async getGameActions(){if(!this.currentRoomId)return[];const t=(await ge(x(this.db,`rooms/${this.currentRoomId}/actions`))).val();return t?Object.values(t):[]}subscribeToGameActions(e){if(!this.currentRoomId)return;const t=x(this.db,`rooms/${this.currentRoomId}/actions`);Ur(t,s=>{const i=s.val();i&&e(i)})}async sendSpecialWin(e){this.currentRoomId&&await ve(x(this.db,`rooms/${this.currentRoomId}/specialWin`),e)}async sendFiveShiEvent(e){this.currentRoomId&&await ve(x(this.db,`rooms/${this.currentRoomId}/fiveShi`),e)}async sendRedeal(){if(!this.currentRoomId)return;const e={};e[`rooms/${this.currentRoomId}/fiveShi`]=null,e[`rooms/${this.currentRoomId}/redeal`]=Date.now(),await ne(x(this.db),e)}subscribeToSpecialEvents(e){if(!this.currentRoomId)return;const t=x(this.db,`rooms/${this.currentRoomId}`);ye(q(t,"specialWin"),s=>{const i=s.val();i&&e.onSpecialWin&&e.onSpecialWin(i)}),ye(q(t,"fiveShi"),s=>{const i=s.val();i&&e.onFiveShi&&e.onFiveShi(i)}),ye(q(t,"redeal"),s=>{const i=s.val();i&&e.onRedeal&&e.onRedeal(i)})}async setReadyForNextRound(e){this.currentRoomId&&await ne(x(this.db,`rooms/${this.currentRoomId}/players/${this.playerId}`),{isReadyForNextRound:e})}async resetAllPlayersReady(){if(!this.currentRoomId)return;const t=(await ge(x(this.db,`rooms/${this.currentRoomId}/players`))).val()||{},s={};Object.keys(t).forEach(i=>{s[`players/${i}/isReadyForNextRound`]=!1}),await ne(x(this.db,`rooms/${this.currentRoomId}`),s)}waitForAllPlayersReady(){return new Promise(e=>{const t=x(this.db,`rooms/${this.currentRoomId}/players`),s=ye(t,i=>{const r=i.val()||{};Object.values(r).every(a=>a.isCpu?!0:a.isReadyForNextRound===!0)&&(s(),e())})})}}class Zh{constructor(e){this.container=e,this.selectedCards=[],this.playerNames={0:"あなた",1:"CPU 左",2:"CPU 対面",3:"CPU 右"},this.localPlayerIndex=0,this.network=new Xh,this.network.onRoomUpdate=t=>this.updateLobby(t),this.setupStartScreen()}setLocalPlayer(e){this.localPlayerIndex=e,console.log("Renderer: Local Player set to",e),this.updateLayout()}updateLayout(){const e=["player-bottom","player-left","player-top","player-right"];for(let t=0;t<4;t++){const s=document.getElementById(`player-${t}`);if(s){const i=(t-this.localPlayerIndex+4)%4;s.className=`player-area ${e[i]} team-${t%2}`}}}setupStartScreen(){this.container.innerHTML=`
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
      `,document.getElementById("btn-mode-single").onclick=()=>this.setupSinglePlayerSetup(),document.getElementById("btn-mode-multi").onclick=()=>this.setupMultiplayerMenu(),document.getElementById("btn-reset-id").onclick=()=>{confirm(`プレイヤーIDをリセットしますか？
(同じブラウザで2人プレイする場合などに使用します)`)&&(this.network.resetPlayerId(),this.setupStartScreen())}}setupSinglePlayerSetup(){this.container.innerHTML=`
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
      `,document.getElementById("btn-back").onclick=()=>this.setupStartScreen(),document.getElementById("btn-start-single").onclick=()=>{const e=document.getElementById("input-player-name").value.trim();e?(this.playerNames[0]=e,this.setupGameUI(),window.game&&window.game.start()):alert("名前を入力してください")}}setupMultiplayerMenu(){this.container.innerHTML=`
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
      `,document.getElementById("btn-back").onclick=()=>this.setupStartScreen();const e=()=>document.getElementById("input-multi-name").value.trim();document.getElementById("btn-create-room").onclick=async()=>{const t=e();if(!t)return alert("名前を入力してください");const s=await this.network.createRoom(t);s.success?this.setupLobby():alert("エラー: "+s.error)},document.getElementById("btn-join-room").onclick=async()=>{const t=e(),s=document.getElementById("input-room-code").value.trim();if(!t)return alert("名前を入力してください");if(!s)return alert("あいことばを入力してください");const i=await this.network.joinRoom(s,t);i.success?this.setupLobby():alert("エラー: "+i.error)},document.getElementById("btn-paste-code").onclick=async()=>{try{const t=await navigator.clipboard.readText();document.getElementById("input-room-code").value=t}catch{alert("クリップボードの読み取りに失敗しました")}}}setupLobby(){this.container.innerHTML=`
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
      `,document.getElementById("btn-leave-room").onclick=()=>{location.reload()},document.getElementById("btn-start-multi").onclick=()=>{this.network.startGame()},document.getElementById("btn-lobby-copy").onclick=()=>{const e=document.getElementById("lobby-room-code").textContent;navigator.clipboard.writeText(e);const t=document.getElementById("btn-lobby-copy");t.textContent="コピー済",setTimeout(()=>t.textContent="コピー",2e3)}}updateLobby(e){if(!document.getElementById("lobby-room-code"))return;if(!e){alert("部屋が解散されました"),this.setupMultiplayerMenu();return}document.getElementById("lobby-room-code").textContent=this.network.currentRoomId;const t=document.getElementById("lobby-players");t.innerHTML="";for(let s=0;s<4;s++){const i=Object.values(e.players||{}).find(o=>o.index===s),r=document.createElement("div");r.style.border="2px solid var(--wood-dark)",r.style.padding="20px",r.style.borderRadius="10px",r.style.background="rgba(0,0,0,0.3)",r.style.width="150px",r.style.textAlign="center",i?r.innerHTML=`
                <div style="font-size:1.2em; font-weight:bold;">${i.name}</div>
                <div style="font-size:0.8em; color:#aaa;">${i.isHost?"HOST":"READY"}</div>
              `:r.innerHTML='<div style="color:#666;">募集中...</div>',t.appendChild(r)}this.network.isHost?(document.getElementById("host-controls").style.display="block",document.getElementById("guest-msg").style.display="none"):(document.getElementById("host-controls").style.display="none",document.getElementById("guest-msg").style.display="block"),e.status}setupGameUI(){this.container.innerHTML="";const e=document.createElement("div");e.id="game-board",e.innerHTML=`
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
    `,this.container.appendChild(e),this.container.insertAdjacentHTML("beforeend",`
          <div id="controls">
             <button id="btn-pass">なし (パス)</button>
             <button id="btn-action">決定</button>
          </div>

          <!-- Debug Log Panel -->
          <div id="network-log" style="display:none; position:absolute; top:0; left:0; width:250px; height:400px; overflow-y:scroll; background:rgba(0,0,0,0.8); color:#0f0; font-family:monospace; font-size:10px; z-index:9999; padding:5px; pointer-events:none; opacity:0.8;">
            <div>=== Network Log ===</div>
          </div>
    `),this.createSettingsUI(),document.getElementById("btn-pass").onclick=()=>window.game.handleHumanAction({action:"pass"}),document.getElementById("btn-action").onclick=()=>this.submitAction(),document.getElementById("btn-next-round").onclick=()=>{document.getElementById("result-modal").style.display="none",this.nextRoundCallback&&this.nextRoundCallback()},this.updateLayout()}render(e){if(!document.getElementById("player-0"))return;this.updateLayout(),e.players.forEach(s=>this.renderHand(s)),e.teamScores&&this.updateScores(e.teamScores);const t=document.getElementById("turn-info");if(e.gameOver)t.textContent="ゲーム終了";else{const s=e.turnPlayerIndex;let i=this.playerNames[s]||`Player ${s}`;const r=s===this.localPlayerIndex;r&&(i+=" (あなた)");let o=i,a="";e.currentAttack?(a=`攻め手: ${e.currentAttack.card.isJewel?"玉":e.currentAttack.card.type}`,t.style.color=r?"#f1c40f":"#ffffff"):(a="親 (攻め)",t.style.color=r?"#00ff00":"#ffffff"),t.innerText=`${o}
${a}`}this.updateControls(e),this.updateNameTags()}updateControls(e){const t=document.getElementById("btn-action");if(!t)return;const s=e.turnPlayerIndex===this.localPlayerIndex&&!e.gameOver,i=document.getElementById("btn-pass");i.disabled=!s,!e.currentAttack&&s&&(i.disabled=!0),t.disabled=!s,s&&(e.currentAttack?t.textContent="受けて攻める":t.textContent="攻める")}enableControls(e){const t=document.getElementById("btn-action"),s=document.getElementById("btn-pass");t&&(e?(t.disabled=!1,s.disabled=!1):(t.disabled=!0,s.disabled=!0))}renderHand(e){const t=`player-${e.id}`,s=this.container.querySelector(`#${t}`);if(!s)return;const i=s.querySelector(".hand");i.innerHTML="";const r=e.id===this.localPlayerIndex;e.hand.forEach(o=>{const a=document.createElement("div");a.className="card",r?(a.textContent=o.isJewel?"玉":o.type,a.onclick=()=>this.toggleSelect(o,a),a.ondblclick=()=>this.handleDoubleClick(o,a)):a.classList.add("hidden"),this.selectedCards.find(l=>l.id===o.id)&&a.classList.add("selected"),i.appendChild(a)})}toggleSelect(e,t){if(this.selectedCards.some(s=>s.id===e.id))this.selectedCards=this.selectedCards.filter(s=>s.id!==e.id),t.classList.remove("selected");else{if(this.selectedCards.length>=2)return;this.selectedCards.push(e),t.classList.add("selected")}}handleDoubleClick(e,t){const s=window.game;if(s.turnPlayerIndex===this.localPlayerIndex&&!s.gameOver){if(this.selectedCards.length===1&&!this.selectedCards.some(i=>i.id===e.id)){this.selectedCards.push(e),t.classList.add("selected"),this.submitAction();return}this.selectedCards.length===0&&this.toggleSelect(e,t)}}submitAction(){if(this.selectedCards.length!==2){alert("カードを2枚選択してください (受け・攻め、または伏せ・攻め)");return}window.game.handleHumanAction({action:"playTurn",card1:this.selectedCards[0],card2:this.selectedCards[1]}),this.selectedCards=[]}showPlay(e,t,s,i){const r=this.container.querySelector(`#player-${e}`);if(!r)return;const o=r.querySelector(".row-receive"),a=r.querySelector(".row-attack"),l=document.createElement("div");l.className="card small",i?(l.classList.add("hidden"),l.classList.add("lead-hidden")):l.textContent=t.isJewel?"玉":t.type;const c=document.createElement("div");c.className="card small",c.textContent=s.isJewel?"玉":s.type,o.appendChild(l),a.appendChild(c);const u=i?"攻":"受・攻",h=s.isJewel?"玉":s.type;this.showBubble(e,`${u}: ${h}`)}showBubble(e,t){const s=this.container.querySelector(`#player-${e} .status-bubble`);s&&(s.textContent=t,s.classList.add("show"),setTimeout(()=>s.classList.remove("show"),2e3))}revealLastLead(e,t){const s=this.container.querySelector(`#player-${e}`);if(!s)return;const r=s.querySelector(".row-receive").querySelector(".lead-hidden");r&&(r.classList.remove("hidden"),r.classList.remove("lead-hidden"),r.textContent=t.isJewel?"玉":t.type,r.style.color="#f1c40f")}updateScores(e){const t=document.getElementById("score-0"),s=document.getElementById("score-1");t&&(t.textContent=e[0]),s&&(s.textContent=e[1])}showRoundResult(e,t,s){const i=document.getElementById("result-modal"),r=document.getElementById("result-title"),o=document.getElementById("result-msg"),a=document.getElementById("btn-next-round"),l=e%2===0?"チームA (あなた/味方)":"チームB (相手)",c=s?"勝負あり！":"ラウンド終了";r.textContent=c,o.innerHTML=`勝者: プレイヤー ${e} (${l})<br>得点: +${t}`,s?(a.textContent="リロードして再開",this.nextRoundCallback=()=>location.reload()):(a.textContent="次のラウンドへ",this.nextRoundCallback=()=>window.game.nextRound(e)),i.style.display="block"}clearField(){this.container.querySelectorAll(".row-receive, .row-attack").forEach(t=>t.innerHTML="")}log(e){const t=document.getElementById("log-short");t&&(t.textContent=e,t.style.opacity=1,setTimeout(()=>t.style.opacity=0,3e3)),console.log(e),this.logNetwork(e)}logNetwork(e){const t=document.getElementById("network-log");if(t){const s=document.createElement("div");s.textContent=`[${new Date().toLocaleTimeString()}] ${e}`,s.style.borderBottom="1px solid #333",t.appendChild(s),t.scrollTop=t.scrollHeight}console.log("[NET]",e)}highlightPlayer(e){this.container.querySelectorAll(".player-area").forEach(i=>i.style.filter="brightness(0.7)");const s=this.container.querySelector(`#player-${e}`);s&&(s.style.filter="brightness(1.0)")}updateNameTags(){for(let e=0;e<4;e++){const t=this.container.querySelector(`#player-${e}`);if(t){const s=t.querySelector(".name-tag");if(s){let i=this.playerNames[e]||`Player ${e}`;e===this.localPlayerIndex?(i+=" (あなた)",s.classList.add("is-me"),s.style.color="#f1c40f",s.style.fontWeight="bold",s.style.border="2px solid #f1c40f",s.style.padding="2px 8px",s.style.borderRadius="10px"):(s.classList.remove("is-me"),s.style.color="",s.style.fontWeight="",s.style.border=""),s.textContent=i}if(e===0){const i=document.getElementById("name-0-score");i&&(i.textContent=this.playerNames[0])}}}}createSettingsUI(){const e=document.createElement("button");e.id="btn-settings",e.textContent="⚙️ 設定",e.className="settings-button",e.onclick=()=>{const r=document.getElementById("settings-modal");r.style.display=r.style.display==="block"?"none":"block"},this.container.appendChild(e);const t=document.createElement("div");t.id="settings-modal",t.className="settings-modal",t.style.display="none";const s=document.createElement("div");if(s.className="settings-content",this.network.currentRoomId){const r=document.createElement("div");r.className="settings-row",r.innerHTML=`
              <span>ルームID: <strong>${this.network.currentRoomId}</strong></span>
              <button id="btn-copy-id" style="margin-left:10px;">コピー</button>
          `,s.appendChild(r),setTimeout(()=>{const o=document.getElementById("btn-copy-id");o&&(o.onclick=()=>{navigator.clipboard.writeText(this.network.currentRoomId),o.textContent="コピーしました",setTimeout(()=>o.textContent="コピー",2e3)})},0)}const i=document.createElement("div");i.className="settings-row",i.innerHTML=`
            <span>ネットワークログ表示</span>
            <button id="btn-toggle-log">表示</button>
        `,s.appendChild(i),setTimeout(()=>{const r=document.getElementById("btn-toggle-log");r&&(r.onclick=()=>{const o=document.getElementById("network-log");o&&(o.style.display=o.style.display==="none"?"block":"none",r.textContent=o.style.display==="none"?"表示":"非表示")})},0),t.appendChild(s),this.container.appendChild(t)}}document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("game-container"),e=new Zh(n),t=new Zr(e);window.game=t});
