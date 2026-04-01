export type Language = 'en' | 'ja';

export const translations = {
  en: {
    title: 'Micromouse Visualizer V2',
    generateMaze: '🎲 Random Maze',
    straightCost: 'Straight Cost',
    turnCost: 'Turn Cost',
    totalCost: 'Total Cost',
    editModeOn: '✏️ Edit Maze',
    editModeOff: '✅ Finish Editing',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    stepForward: 'Next',
    stepBackward: 'Back',
    speed: 'Speed',
    step: 'Step',
    currentSeed: 'Current Seed',
    statusRunning: '▶ RUNNING',
    statusPaused: '⏸ PAUSED',
    importMaz: '📁 Load .maz',
    exportMaz: '💾 Save .maz',
    invalidMaz: 'Invalid .maz file format.',
    mazeSize: 'Maze Size',
    mazeSize8: '8x8 (Micro)',
    mazeSize16: '16x16 (Classic)',
    mazeSize32: '32x32 (Half-size)',
    survivalModeOn: '🔦 Survival Mode',
    survivalModeOff: '💡 Full Vision',
    campaignMode: '🏆 Campaign Mode',
    stage: 'Stage',
    stageClear: '🎉 Stage Cleared!',
    bestCost: 'Best Cost',
    locked: '🔒 Locked',
    nextStage: 'Next Stage',
    steps: 'Steps',
    turns: 'Turns',
    efficiency: 'Efficiency',
    optimalCost: 'Optimal Cost',
    view2D: '2D View',
    view3D: '3D View',
    faceControlOn: '👤 Face Control ON',
    faceControlOff: '📷 Enable Face Control',
    floodFill: 'Adachi (Flood Fill)',
    centripetal: 'Centripetal Method',
    addAlgo: 'Add Algorithm',
    removeAlgo: 'Remove',
    tutorial: {
      basics: {
        title: 'Basics: The Goal',
        step1: {
          title: 'Welcome!',
          text: 'Micromouse is a robot that solves a maze. The green square (S) is the start.'
        },
        step2: {
          title: 'The Goal',
          text: 'The gold area (G) is the goal. Usually, it is a 2x2 area in the center.'
        },
        step3: {
          title: 'Manual Control',
          text: 'Try moving the mouse using the arrow keys on your keyboard!'
        }
      },
      lefthand: {
        title: 'Left-Hand Rule',
        step1: {
          title: 'Simple Algorithm',
          text: 'The Left-Hand rule is simple: Always keep your left hand on the wall.'
        },
        step2: {
          title: 'Simulating',
          text: 'Press the "Play" button or use "Next" to see it in action!'
        },
        quiz1: {
          title: 'Left-Hand Quiz',
          text: 'Check your understanding!',
          question: 'If there is no wall on the left, what will the mouse do?',
          opt1: 'Turn Left',
          opt2: 'Move Forward',
          opt3: 'Turn Right',
          hint: 'Think about the "Left-Hand" rule priority.'
        }
      }
    }
  },
  ja: {
    title: 'マイクロマウス・ビジュアライザ V2',
    generateMaze: '🎲 迷路再生成',
    straightCost: '直進コスト',
    turnCost: 'ターンコスト',
    totalCost: '総コスト',
    editModeOn: '✏️ 迷路を編集',
    editModeOff: '✅ 編集完了',
    play: '再生',
    pause: '停止',
    reset: 'リセット',
    stepForward: 'コマ送り',
    stepBackward: '戻る',
    speed: '再生速度',
    step: 'ステップ',
    currentSeed: '現在のシード値',
    statusRunning: '▶ 実行中',
    statusPaused: '⏸ 停止中',
    importMaz: '📁 .maz 読込',
    exportMaz: '💾 .maz 保存',
    invalidMaz: '無効な .maz ファイル形式です。',
    mazeSize: '迷路サイズ',
    mazeSize8: '8x8 (極小)',
    mazeSize16: '16x16 (クラシック)',
    mazeSize32: '32x32 (ハーフサイズ)',
    survivalModeOn: '🔦 サバイバルモード',
    survivalModeOff: '💡 通常モード',
    campaignMode: '🏆 キャンペーンモード',
    stage: 'ステージ',
    stageClear: '🎉 ステージクリア！',
    bestCost: '自己ベスト',
    locked: '🔒 ロック中',
    nextStage: '次のステージへ',
    steps: '歩数',
    turns: 'ターン数',
    efficiency: '効率',
    optimalCost: '理論最短コスト',
    view2D: '2D表示',
    view3D: '3D表示',
    faceControlOn: '👤 顔認識操作 ON',
    faceControlOff: '🎥 顔認識操作を有効化',
    floodFill: '足立法',
    centripetal: '求心法',
    addAlgo: '追加',
    removeAlgo: '削除',
    tutorial: {
      basics: {
        title: '基本：ゴールを目指せ',
        step1: {
          title: 'ようこそ！',
          text: 'マイクロマウスは、迷路を解く自律走行ロボットです。緑色の (S) がスタート地点です。'
        },
        step2: {
          title: 'ゴール地点',
          text: '中央の金色のエリア (G) がゴールです。通常、公式ルールでは16x16の中心2x2エリアがゴールとなります。'
        },
        step3: {
          title: '手動で動かしてみよう',
          text: 'キーボードの矢印キーを使って、マウスを自由に動かしてみましょう。壁にぶつかると止まります。'
        }
      },
      lefthand: {
        title: '左手法（りだほう）',
        step1: {
          title: '一番シンプルなアルゴリズム',
          text: '左手法は「常に左側の壁に手を触れて進む」というとても単純なルールです。'
        },
        step2: {
          title: 'シミュレーション開始',
          text: '再生ボタンを押すか、「コマ送り」を使って、左手法の動きを確認してみましょう。'
        },
        quiz1: {
          title: '左手法クイズ',
          text: '左手法のルールを理解できたかチェック！',
          question: 'もし左側に壁がなかったら、マウスはどう動くべき？',
          opt1: '左に曲がる',
          opt2: '前進する',
          opt3: '右に曲がる',
          hint: '「左側の壁に手を触れ続ける」ためにはどうすればいいでしょう？'
        }
      }
    }
  }
};
