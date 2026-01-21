---
name: Modern Web Development (Next.js & React)
description: Best practices for modern web development using Next.js (App Router), React, and Tailwind CSS.
---

# 概要

Next.js (App Router), React, Tailwind CSS を使用した最新のWeb開発基準。
「動けばいい」ではなく、パフォーマンス、アクセシビリティ、保守性を考慮したコードを生成すること。

# 1. 技術スタックとバージョン

- **Framework:** Next.js (最新安定版, App Router必須)
- **UI Library:** React (Functional Components + Hooks)
- **Styling:** Tailwind CSS (Utility-first)
- **Language:** TypeScript (推奨) または JavaScript (ESModules)

# 2. コーディングルール

## React / Components

- **Functional Components:** クラスコンポーネントは使用禁止。全て関数コンポーネントで記述する。
- **Hooksの適正使用:** `useEffect` の乱用を避ける。Server Componentsで処理できるものはサーバー側で行う。
- **Props:** バケツリレーを避ける構成を意識する。
- **State管理:** 複雑なStateはContext APIや外部ストアを検討するが、まずはローカルStateで完結しないか考える。

## Styling (Tailwind CSS)

- **Utility First:** 独自のCSSクラス(`.css`)は極力作らず、Tailwindのユーティリティクラスを使用する。
- **Responsive:** モバイルファーストで記述する（例: `class="block md:flex"`）。
- **Colors:** 原色(red, blue)を避け、TailwindのSlate, Zinc, Sky, Indigoなどの洗練されたパレットを使用する。

## HTML / A11y

- **セマンティックマークアップ:** `<div>` だけでなく `<header>`, `<main>`, `<article>`, `<section>`, `<footer>` を適切に使用する。
- **画像:** Next.jsの `<Image>` コンポーネントを使用し、`alt` 属性を必ず設定する。

# 3. ディレクトリ構成 (Next.js App Router)

- `app/`: ページルーティングとレイアウト定義
- `components/`: 再利用可能なUIコンポーネント
- `lib/` or `utils/`: ユーティリティ関数
- `public/`: 静的資産
