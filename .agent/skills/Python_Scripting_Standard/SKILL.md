---
name: Python Scripting Standard
description: Guidelines for writing clean, maintainable, and modern Python scripts.
---

# 概要

可読性が高く、保守しやすいPythonスクリプトの記述ルール。
Blenderスクリプトや汎用ツール作成時に適用する。

# 1. バージョンと構文

- **Python Version:** 3.10 以降を推奨 (match文などが使用可能)
- **Formatting:** `f-string` を使用する。`%` 演算子や `.format()` は避ける。

# 2. 型とドキュメント

- **Type Hints:** 関数の引数と戻り値には可能な限り型ヒント (`def func(a: int) -> str:`) を付与する。
- **Docstrings:** 関数やクラスには Docstring (Google Style or NumPy Style) を記述し、引数と戻り値を説明する。

# 3. コードスタイル (PEP 8 準拠)

- **命名規則:**
  - 変数・関数: `snake_case`
  - クラス: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`
- **インポート:** 標準ライブラリ → サードパーティ → ローカルモジュール の順で記述する。

# 4. 実装パターン

- **メイン実行ブロック:** スクリプトとして実行する場合は必ず `if __name__ == "__main__":` ブロックを使用する。
- **パス操作:** 文字列操作ではなく、`pathlib.Path` モジュールを使用する。
- **リソース管理:** ファイル操作などは `with open(...)` 構文を使用し、確実にクローズする。
