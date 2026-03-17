import React, { useEffect, useRef } from 'react';
import type { MazeState } from '../types/maze';
import { Direction } from '../types/maze';

interface MazeRendererProps {
  maze: MazeState;
  cellSize?: number;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({ maze, cellSize = 30 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawMaze = (ctx: CanvasRenderingContext2D) => {
    const { width, height, walls, goalX, goalY, goalWidth, goalHeight } = maze;
    const canvasWidth = width * cellSize;
    const canvasHeight = height * cellSize;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Highlight Goal Area
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.fillRect(goalX * cellSize, goalY * cellSize, goalWidth * cellSize, goalHeight * cellSize);

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvasWidth, y * cellSize);
      ctx.stroke();
    }

    // Draw Walls
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const wallMask = walls[y * width + x];
        const cx = x * cellSize;
        const cy = y * cellSize;

        // North
        if (wallMask & (1 << Direction.North)) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cellSize, cy);
          ctx.stroke();
        }
        // East
        if (wallMask & (1 << Direction.East)) {
          ctx.beginPath();
          ctx.moveTo(cx + cellSize, cy);
          ctx.lineTo(cx + cellSize, cy + cellSize);
          ctx.stroke();
        }
        // South
        if (wallMask & (1 << Direction.South)) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + cellSize);
          ctx.lineTo(cx + cellSize, cy + cellSize);
          ctx.stroke();
        }
        // West
        if (wallMask & (1 << Direction.West)) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + cellSize);
          ctx.stroke();
        }
      }
    }

    // Mark Start (0,0)
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', cellSize / 2, cellSize / 2);

    // Mark Goal
    ctx.fillStyle = '#FFD700';
    ctx.fillText('G', (goalX + goalWidth / 2) * cellSize, (goalY + goalHeight / 2) * cellSize);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawMaze(ctx);
      }
    }
  }, [maze, cellSize]);

  return (
    <div className="maze-renderer-container">
      <canvas
        ref={canvasRef}
        width={maze.width * cellSize}
        height={maze.height * cellSize}
        style={{ border: '2px solid #444', borderRadius: '4px' }}
      />
    </div>
  );
};

export default MazeRenderer;
