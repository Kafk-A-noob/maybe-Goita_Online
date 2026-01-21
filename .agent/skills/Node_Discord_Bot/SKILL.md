---
name: Discord Bot Development (Node.js & discord.js)
description: Standard practices for building secure and robust Discord bots using discord.js v14+.
---

# 概要

Node.js と discord.js v14以降を使用したDiscord Bot開発のガイドライン。
セキュリティと安定稼働を最優先する。

# 1. バージョンとAPI

- **Library:** discord.js v14 以上 (Intentsの明示が必須)
- **Node.js:** LTSバージョン推奨
- **Commands:** Interaction Framework (Slash Commands) を基本とする。レガシーなメッセージコマンド(`!help`など)は推奨しない。

# 2. セキュリティ (絶対遵守)

- **Token管理:** Bot Token や API Key は**絶対に**コード内にハードコードしない。必ず環境変数 (`.env` ファイル + `dotenv` パッケージ) から読み込むこと。
- **Git:** `.env` は必ず `.gitignore` に含めること。

# 3. エラーハンドリングと安定性

- **非同期処理:** `async/await` を使用し、必ず `try...catch` ブロックでエラーを捕捉する。
- **未処理の例外:** `process.on('unhandledRejection')` などでクラッシュを防ぐ最低限の措置を提案する。
- **ログ:** エラーログは詳細に出力し、デバッグ可能な状態にする。

# 4. コード構成

- **イベント駆動:** `client.on('ready', ...)` や `client.on('interactionCreate', ...)` は、可能な限り別ファイル（ハンドラ）に分割することを検討する（大規模な場合）。
- **デプロイ:** Slash Commandsの登録スクリプト等は分離して管理する。
