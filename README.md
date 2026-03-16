# Micromouse-Algorithm-Visualizer V2

[日本語](#日本語) | [English](#english)

---

## 日本語

### 1. プロジェクト概要
**Micromouse-Algorithm-Visualizer V2** は、マイクロマウスの経路探索アルゴリズムを視覚的に学ぶための次世代シミュレータです。ブラウザ上で完結し、実機の特性に合わせたアルゴリズムチューニングを可能にします。

### 2. 開発の背景と目的
- **教育と普及**: 新入生や初学者がマイクロマウスの楽しさを知るための入口として。
- **競技性の向上**: 世界中の開発者が集まり、アルゴリズムを比較・共有できるプラットフォームの提供。
- **アクセスのしやすさ**: DBレス構成による運用コストゼロと、完全なオフライン動作（PWA）の実現。

### 3. 主要機能
- **迷路生成**: 公式仕様（16x16, 2x2ゴール）に基づいたシード固定迷路の生成。
- **アルゴリズム比較**: 複数アルゴリズムの同時実行とコスト評価。
- **ゲーミフィケーション**: ゴースト対戦、段位認定キャンペーン。
- **サンドボックス**: Monaco Editorによるブラウザ上での安全なコード実行環境。
- **多言語対応**: 日本語と英語を完全にサポート。

### 4. 技術スタック
- **Frontend**: React (Next.js / Vite), TypeScript
- **Rendering**: HTML5 Canvas (2D), React Three Fiber (3D)
- **State**: Zustand
- **Sandbox**: Web Worker
- **CI/CD**: GitHub Pages / Vercel

---

## English

### 1. Project Overview
**Micromouse-Algorithm-Visualizer V2** is a next-generation simulator designed to visually learn and test Micromouse pathfinding algorithms. It runs entirely in the browser and supports algorithm tuning based on real-world robot characteristics.

### 2. Background and Goals
- **Education & Outreach**: Serves as an entry point for students and beginners to explore Micromouse.
- **Competitive Excellence**: Provides a platform for developers worldwide to compare and share algorithms.
- **Accessibility**: Zero operational cost with a DB-less architecture and full offline support (PWA).

### 3. Key Features
- **Maze Generation**: Seed-based generation following official competition specs (16x16, 2x2 goal).
- **Algorithm Comparison**: Simultaneous execution of multiple algorithms with cost evaluation.
- **Gamification**: Ghost matches and rank certification campaigns.
- **Sandbox**: Secure code execution environment using Monaco Editor in the browser.
- **i18n**: Full support for Japanese and English.

### 4. Tech Stack
- **Frontend**: React (Next.js / Vite), TypeScript
- **Rendering**: HTML5 Canvas (2D), React Three Fiber (3D)
- **State**: Zustand
- **Sandbox**: Web Worker
- **CI/CD**: GitHub Pages / Vercel
