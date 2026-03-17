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

### 3. ゲーム内容 / Game Features

#### [日本語]
本プロジェクトは単なるシミュレータではなく、以下のゲーミフィケーション要素を備えた体験型プラットフォームです。
- **ゴースト対戦**: 他のユーザーの走行履歴（URL共有）とリアルタイムで並走し、タイムを競うことができます。
- **視界制限サバイバル**: 周囲1マス以外が暗闇の迷路を、キーボード操作で手動攻略する人間 vs アルゴリズムの対戦モード。
- **段位認定キャンペーン**: 用意されたステージを順にクリアし、初心者から達人までランクアップする成長要素。
- **3D探索**: マイクロマウスの視点（FPS）で迷路内を自由に移動できる臨場感あふれるモード。
- **ウィンク・ドライブ**: AI顔認識を利用し、ウィンクで曲がる等の特殊な操作方法を提供（配信者・パーティ向け）。

#### [English]
This project is more than a simulator; it is an interactive platform with gamified elements:
- **Ghost Competition**: Compete in real-time against other users' recorded runs shared via URL.
- **Survival Mode**: A human vs. algorithm challenge where you manually navigate a dark maze with only 1-cell visibility.
- **Rank Certification**: Progress through curated stages and rank up from Beginner to Grandmaster.
- **3D Exploration**: An immersive First-Person Perspective (FPP) mode to navigate through the maze as if you were the mouse.
- **Wink Drive**: Special AI-powered facial recognition control (e.g., turning by winking), optimized for streamers and parties.

### 4. 先端機能 / Advanced Features
- **AR 迷路スキャナ (OpenCV.js)**: カメラで撮影した手書きの迷路を即座にデジタルデータに変換。
- **強化学習(RL) 可視化 (TensorFlow.js)**: AIが試行錯誤して最短経路を見つける「学習の過程」をリアルタイムで表示。
- **AR Maze Scanner (OpenCV.js)**: Instantly convert hand-drawn mazes into digital data via camera.
- **RL Visualization (TensorFlow.js)**: Real-time visualization of the reinforcement learning process as the AI matures its pathfinding strategy.

### 5. セキュリティ・アクセシビリティ / Security & Accessibility
- **安全な外部コード実行**: Web Worker によるサンドボックス化で、ユーザーのカスタムコードを隔離。
- **カラーブラインド対応**: 色覚多様性に配慮し、パターン描画（幾何学模様）を併用したCanvas描画。
- **Secure Code Execution**: Sandbox environment using Web Workers to isolate custom user navigation algorithms.
- **Color-Blind Friendly**: Design ensuring visibility for diverse color vision through pattern fills and high-contrast geometric styles.

### 6. 技術スタック / Tech Stack
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
