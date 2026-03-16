# **要件定義書 (V2)**

## **1\. プロジェクト概要**

### **1.1 プロジェクト名**

Micromouse-Algorithm-Visualizer V2

### **1.2 目的・背景**

マイクロマウス班の班長に就任しました。
新入生歓迎会にて、マイクロマウスを楽しく知ってもらうために制作します。
また、所属大学以外の方にも遊んでいただく想定で制作しています。

マイクロマウスの経路探索アルゴリズムを視覚的に学ぶためのシミュレータを刷新する。ブラウザ（クライアント）側で完結する滑らかな60fpsのシミュレータを構築する。

「世界中のマイクロマウス開発者が集まるWebプラットフォーム」としての価値を持たせるため、DBを使用しない（運用コストゼロ）状態でのゲーミフィケーション機能、安全なユーザーコード実行環境、多言語対応・SNS拡散機能を実装する。

### **1.3 ターゲットユーザー**

* マイクロマウスサークル・部活の開発者（実機の特性に合わせたアルゴリズムチューニング層）。  
* 新入生・プログラミング初学者。  
* 競技プログラマ・他校の技術者、および海外のマイクロマウス競技者。  
* ゲームが好きな方。
* 配信者など。

## **2\. システム構成**

### **2.1 技術スタック（完全静的・DBレス構成）**

* **Frontend UI:** React (Next.js Static Export または Vite)  
* **Language:** TypeScript  
* **State Management:** Zustand (マクロな状態管理のみ)  
* **Rendering:** HTML5 Canvas API (2D), React Three Fiber (3D)  
* **Code Editor:** Monaco Editor (ブラウザ上のコード記述用)  
* **Sandbox Execution:** Web Worker (ユーザー定義アルゴリズムの隔離実行)  
* **i18n (多言語対応):** react-i18next (日本語・英語対応)  
* **AI & CV:** MediaPipe (顔認識), OpenCV.js (画像処理), TensorFlow.js  
* **データ保存・共有:** localStorage ＆ LZString \+ ランレングス圧縮URL  
* **PWA:** Service Worker を用いたオフライン動作サポート  
* **Hosting:** GitHub Pages または Vercel (完全無料枠)

## **3\. 機能要件一覧**

| ID | カテゴリ | 機能名 | 機能概要 |
| :---- | :---- | :---- | :---- |
| F-01 | コア | 大会仕様迷路生成 | 16x16、ゴール2x2（柱なし）の公式仕様に基づく迷路を生成する。 |
| F-02 | コア | 可変サイズ・シード固定 | 迷路サイズの変更と、シード値入力による完全な再現生成。 |
| F-03 | コア | 到達可能チェック | ゴール不可能な迷路はユーザーに見せずに自動破棄・再生成する。 |
| F-04 | コア | 標準フォーマット読込 | 標準的な .maz 等のテキストベース迷路ファイルを読み書きする。 |
| F-05 | 探索 | 未知迷路シミュレーション | 仮想センサーで壁を検知・マップ更新する過程を再現。 |
| F-06 | 探索 | 複数アルゴリズム比較 | 既存アルゴリズムを画面分割で同時実行し、ステップ数を比較。 |
| F-07 | 描画 | 再生コントローラー | アニメーションの「再生・一時停止・コマ送り・戻し」および速度調整。 |
| F-08 | UI | 迷路エディタ | 画面上のグリッドをクリックして壁を自由に配置・削除できる。 |
| F-09 | ゲーム | ゴースト（残像）対戦 | 移動履歴をURL化し、他者が開くと半透明のゴーストが出現し並走する。 |
| F-10 | ゲーム | 視界制限サバイバル | 周囲1マス以外が暗闇の状態で、人間が手動操作でゴールを目指す。 |
| F-11 | ゲーム | 段位認定キャンペーン | 固定シードのステージ群を順にクリアし、localStorageに進捗を記録。 |
| F-12 | 広報 | 3D FPS探索モード | Three.jsを使用し、マイクロマウス目線（一人称）で迷路内を歩き回る。 |
| F-13 | 広報 | 学習チュートリアル | 図解やクイズで探索アルゴリズムの基礎を解説する。 |
| F-14 | 発展 | 独自アルゴリズム実装 | Monaco Editorで関数を記述し迷路探索を実行する。※PC/タブレット専用機能。 |
| F-15 | 分析 | 機体パラメータ設定 | 「直進コスト」「ターンコスト」を設定し、実走想定コストで経路を評価。 |

## **4\. データ仕様・状態管理設計**

### **4.1 URLパラメータによるデータ共有スキーム (不正対策と圧縮)**

* **URL長圧縮ロジック (RLE \+ Base64):** 移動履歴 \["UP", "UP", "UP", "RIGHT"\] をランレングス圧縮（U3R1）に変換後、lz-string でBase64化。

### **4.2 データ構造の最適化 (TypedArrayの採用)**

* 迷路データや歩数マップは、すべて **Uint8Array や Int16Array などの型付き一次元配列（TypedArray）** を使用してメモリ空間を連続して確保し、GCスパイクを回避する。座標アクセスは index \= y \* width \+ x で行う。

### **4.3 localStorage 保存データスキーム (キャンペーン進捗・設定)**

DBを持たない本システムにおいて、ユーザーのブラウザ内に個人の進捗や自己ベスト、設定を保存するためのJSONデータスキームを定義する。

* **キー:** mm\_visualizer\_v2\_save\_data  
* **JSON構造イメージ:**  
  {  
    "campaign\_progress": 5,   
    "unlocked\_avatars": \["default\_mouse", "sports\_car"\],   
    "best\_times": {   
      "stage\_1": 15.2,  
      "stage\_2": 42.8  
    },  
    "settings": {   
      "animation\_speed": 1.5,  
      "show\_step\_numbers": true,  
      "color\_blind\_mode": false,  
      "language": "ja"  
    }  
  }

## **5\. セキュリティ・非機能要件**

### **5.1 独自アルゴリズム実行のサンドボックス化 (XSS・無限ループ対策)**

* **Web Worker による隔離:** メインスレッドとは別の Web Worker 内でユーザーコードを実行。3,000msを超えた場合は無限ループと判定し強制キルする。

### **5.2 URL改ざんと不正リプレイの防止 (Validation by Re-simulation)**

* URLからゴースト対戦データを読み込んだ際、即座に描画せず、**システム内部の仮想迷路上で移動履歴をトレース**し、壁抜けチートを弾く。

### **5.3 エラー・権限拒否時のフォールバックUI (Fallback Navigation)**

* **不正URL:** パース失敗時に専用ダイアログを表示（「データが壊れています。新しい迷路で遊びますか？」）。  
* **カメラ権限:** アクセス拒否・非搭載時はクラッシュさせず、「カメラへのアクセスが許可されていません」と表示して通常モードへ誘導。

### **5.4 アクセシビリティ・色覚多様性への対応 (Color-Blind Friendly)**

* **カラーブラインドモード:** Canvas上の描画を色だけでなく、\*\*斜線パターン・ドットパターン等の幾何学模様（パターンフィル）\*\*と組み合わせて視認性を確保する。

### **5.5 PWA（プログレッシブWebアプリ）とオフライン動作**

* Service Worker を用いてアセットをキャッシュし、地下の部室やWi-Fiのない体育館でも完全オフラインで動作可能にする。※ただし、手書きスキャナ（OpenCV）や顔認識（MediaPipe）などの先端機能用モデルデータはファイルサイズが大きいため、該当機能の初回起動時のみオンライン接続を必須とする

### **5.6 描画パフォーマンスの最適化（再レンダリング地獄の回避）**

* アニメーションの現在位置（step\_index）はReactのStateに入れず、**useRef に保持して生のCanvas APIを直接叩いて描画する**アーキテクチャを必須とする。

### **5.7 共有・拡散仕様 (OGPとSNS連携)**

* **静的OGP:** ベースとして全ページ共通のリッチな静的OGP画像を用意。  
* **動的OGP生成:** 発展機能として、Cloudinary等の画像変換APIに迷路パラメータを渡し、動的に迷路のサムネイルを生成する仕組みを構築する。  
* **URL長制限（約2000文字）の回避:** 32x32などの複雑な迷路データをそのままCloudinary等のURLパラメータに埋め込むと文字数制限を超過するリスクがある。そのため、\*\*「 일정サイズ以上の迷路は間引いて簡易なシルエットにする」「解像度を下げてエンコードする」\*\*といった、URL長制限を確実に回避するフォールバック処理を必須要件とする。

### **5.8 グローバル展開 (i18n 多言語対応)**

* react-i18next を導入し、日本語(ja)と英語(en)を即座に切り替えられる設計とする。

## **6\. 先端技術との融合（他分野クロスオーバー）**

### **6.1 【コンピュータビジョン】 「手書き迷路」ARスキャナ**

* OpenCV.js を用い、Webカメラで撮影した手書き迷路をデジタルデータに変換。

### **6.2 【機械学習】 強化学習(RL)エージェントのリアルタイム進化可視化**

* TensorFlow.js を用い、Q-learning等のAIが何百世代とシミュレーションを繰り返し、ゼロから経路を見つけ出す過程をビジュアライズ。

### **6.3 【AI顔認識】 ウィンク・ドライブ（配信者/Vtuber向け）**

* MediaPipe Face Mesh を用いて表情を認識。「ウィンクで曲がる」等のハンズフリー操作を提供し、実況プレイでの配信映えを狙う。

## **7\. モジュール仕様書・関連図**

### **7.1 モジュール関連図 (Mermaid)**

graph TD  
    subgraph Frontend \[React Application Browser\]  
        UI\_Router\[React Router / i18n\]  
        UI\_Config\[設定パネル パラメータ/言語/A11y\]  
        UI\_CodeEditor\[Monaco Editor\]  
          
        State\_Zustand\[(Zustand Store マクロな状態)\]  
        Local\_Ref\[useRef \+ requestAnimationFrame Reactから独立した描画\]  
          
        URL\_Handler\[URL生成・圧縮・パース\]  
        Maz\_Parser\[maz File Import/Export\]  
          
        subgraph Sandbox Environment  
            WebWorker\[Web Worker Thread ユーザーコード隔離実行\]  
        end  
          
        subgraph Renderers  
            Render\_2D\[Canvas 2D Renderer 色+パターン描画\]  
            Render\_3D\[React Three Fiber 3D FPS / Wink Drive\]  
        end  
    end

    UI\_Config \--\> URL\_Handler  
    URL\_Handler \--\>|パース・検証エラー時| UI\_Router  
    URL\_Handler \--\>|成功時| State\_Zustand  
      
    UI\_CodeEditor \--\>|コード| WebWorker  
    State\_Zustand \--\>|TypedArray迷路データ| WebWorker  
    WebWorker \--\>|探索結果| State\_Zustand  
      
    State\_Zustand \--\>|再生トリガー等| Local\_Ref  
    Local\_Ref \--\>|直接描画 DeltaTime考慮| Render\_2D  
    State\_Zustand \--\> Render\_3D

### **7.2 機体の向きとコスト計算ロジック (AlgorithmEngine 拡張)**

探索アルゴリズム（特にA\*等のコスト評価）において、単なるマス目の移動距離だけでなく、機体の旋回を加味した「実走想定コスト (TotalCost)」を算出するための論理モデルを定義する。

アルゴリズム実行時、現在の機体の向き Direction (North, East, South, West) を状態として保持し、次のマスへ移動する際の向きの差分からコストを加算する。

* **直進 (Forward):** 向きの変更なし。  
  TotalCost \+= StraightCost (デフォルト: 1\)  
* **ターン (Turn \- 90度):** 向きが90度変わる。  
  TotalCost \+= TurnCost \+ StraightCost (デフォルトターンコスト: 3\)  
* **Uターン (U-Turn \- 180度):** 向きが180度変わる。  
  TotalCost \+= (TurnCost \* 2\) \+ StraightCost

## **8\. テスト仕様書**

Vibe coding時のAIへのコンテキスト提供、および手動/自動QAにおける重要なテストケースを定義する。

| ID | テスト対象 | 条件・入力値 | 期待される結果 |
| :---- | :---- | :---- | :---- |
| UT-001 | 互換性担保（V1 URLパース） | 古いバージョン v=1 を指定したURLパラメータを読み込ませる | V1のパース仕様に従って正しくデコードされ、迷路が再現されること。 |
| UT-002 | 不正URLフォールバック | パラメータの文字列が途中で切断された無効なBase64URLを開く | アプリがクラッシュせず、「データが壊れています」ダイアログ（フォールバックUI）が表示されること。 |
| UT-003 | サンドボックス（無限ループ） | Monaco Editorに while(true) {} を入力して実行ボタンを押下 | ブラウザがフリーズせず、約3秒後にWeb Workerが強制終了され「実行タイムアウトエラー」が表示されること。 |
| UT-004 | コスト計算（直進 vs ターン） | 直進コスト=1, ターンコスト=5 に設定し、「階段状のジグザグ経路」と「大外回りの直進経路」のアルゴリズム結果を比較する。 | 移動マス数が同じであっても、ターン回数が多い階段状の経路の方が「Total Cost」が大きく計算され、A\*アルゴリズム等が大外回りを選択すること。 |
| UT-005 | .maz ファイルパース | 過去の全日本大会の標準的な16x16 .maz ファイルを読み込む | ファイル内の壁データが正しくTypedArrayに変換され、Canvas上に迷路として描画されること。 |

## **9\. 画面遷移図・UI仕様書**

### **9.1 画面遷移フロー**

\[ / \] ホーム画面 (モード選択)  
  │  
  ├── \[ /simulator \] シミュレータ画面 (通常比較モード)  
  │     ├── (ヘッダー) \--\> 日英切替トグル(EN/JA), カラーブラインドON/OFF  
  │     └── (.maz読込) \--\> ローカルファイルから迷路を上書き  
  │  
  ├── \[ /sandbox \] コーディング道場 ※PC/タブレット専用  
  │  
  ├── \[ /editor \] 迷路エディタ画面  
  │     ├── (シェアボタン) \--\> OGP対応のURL生成モーダル  
  │     └── (カメラスキャン) \--\> OpenCV.js手書き読み込み  
  │  
  ├── \[ /campaign \] 段位認定キャンペーン画面 (ステージセレクト)  
  │  
  └── \[ /challenge \] チャレンジ・対戦画面 (URLからゴースト対戦)  
  │  
  └── \[ /vtuber \] 配信者向け顔認識プレイモード

## **10\. シーケンス図 (データ通信・状態遷移フロー)**

### **10.1 シミュレーション実行・再生フロー (Delta Time 導入版)**

sequenceDiagram  
    participant U as ユーザー  
    participant UI as React UI  
    participant Z as Zustand Store  
    participant A as Algorithm Engine  
    participant Ref as useRef / Canvas API

    U-\>\>UI: 「探索開始」クリック  
    UI-\>\>Z: 現在の迷路データを取得  
    Z--\>\>UI: maze\_data  
    UI-\>\>A: maze\_data と選択アルゴリズムを渡す  
    A--\>\>UI: 探索履歴 (history配列) と 最短経路 (path) を返却  
    UI-\>\>Z: 結果(TypedArray)をマクロ状態として保存  
      
    UI-\>\>Ref: useRef の step\_index \= 0, lastTime \= performance.now() に初期化  
    UI-\>\>Ref: アニメーション開始 (requestAnimationFrame)

    loop requestAnimationFrame (Reactライフサイクル外)  
        Ref-\>\>Ref: 現在の timestamp を取得  
        Ref-\>\>Ref: deltaTime (timestamp \- lastTime) を計算  
          
        %% 144Hzモニタ等でも一定速度で進むように時間ベースで処理  
        alt deltaTime が設定されたフレームレート間隔を超えた場合  
            Ref-\>\>Ref: step\_index をインクリメント  
            Ref-\>\>Ref: 生のCanvas APIで盤面を直接描画  
            Ref-\>\>Ref: lastTime \= timestamp に更新  
        end  
        Ref--\>\>U: アニメーション表示 (滑らかな一定速度)  
    end

### **10.2 ゴースト対戦用 URL発行と読み込みフロー**

sequenceDiagram  
    participant U as ユーザーA  
    participant UI\_A as React UI (AのPC)  
    participant URL as URL生成・OGP生成  
    participant UI\_B as React UI (Bのスマホ)  
    participant U2 as ユーザーB

    U-\>\>UI\_A: 「リプレイをシェア」をクリック  
    UI\_A-\>\>URL: 迷路シード値 と 移動履歴 を渡す  
    URL-\>\>URL: lz-string で圧縮し Base64 化  
    URL-\>\>URL: CloudinaryのURLパラメータを組み立て、動的OGP画像を生成  
    URL--\>\>UI\_A: 共有用URL (/?mode=ghost\&data=xxx)  
    UI\_A--\>\>U: URLをコピー

    Note over U, U2: ユーザーAがSNSでURLを共有

    U2-\>\>UI\_B: URLを開く  
    UI\_B-\>\>URL: パラメータ data=xxx をパース・解凍  
    UI\_B-\>\>UI\_B: 再シミュレーションによるバリデーション  
      
    alt 検証エラー (改ざん・破損)  
        UI\_B--\>\>U2: フォールバックダイアログ表示  
    else 検証成功  
        loop ゲーム中  
            U2-\>\>UI\_B: 操作  
            UI\_B-\>\>UI\_B: ユーザーA(ゴースト)の座標を時間に合わせて更新  
            UI\_B-\>\>UI\_B: Canvasに直接描画  
        end  
    end  
