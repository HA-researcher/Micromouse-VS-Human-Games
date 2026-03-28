import React, { useEffect, useRef } from 'react';
import type { MazeState } from '../types/maze';
import { Direction } from '../types/maze';
import type { MouseState } from '../types/simulator';

interface MazeRendererProps {
  maze: MazeState;
  mouse?: MouseState;
  cellSize?: number;
  onWallToggle?: (x: number, y: number, direction: Direction) => void;
  isSurvivalMode?: boolean;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({ maze, mouse, cellSize = 30, onWallToggle, isSurvivalMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

      // Draw Mouse
      if (mouse) {
        const mx = (mouse.x + 0.5) * cellSize;
        const my = (mouse.y + 0.5) * cellSize;
        const size = cellSize * 0.4;

        ctx.save();
        ctx.translate(mx, my);
        
        // Rotate based on direction
        // Default (North) index 0
        const rotationMap = {
          [Direction.North]: 0,
          [Direction.East]: Math.PI / 2,
          [Direction.South]: Math.PI,
          [Direction.West]: -Math.PI / 2
        };
        ctx.rotate(rotationMap[mouse.direction]);

        // Mouse Shape (Triangle)
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.moveTo(0, -size);    // Tip
        ctx.lineTo(-size * 0.8, size * 0.8); // Back left
        ctx.lineTo(size * 0.8, size * 0.8);  // Back right
        ctx.closePath();
        ctx.fill();

        // Mouse Eye (Direction hint)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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

      // Survival Mode Mask (Flashlight Effect)
      if (isSurvivalMode && mouse) {
        ctx.save();
        const mx = (mouse.x + 0.5) * cellSize;
        const my = (mouse.y + 0.5) * cellSize;
        
        ctx.globalCompositeOperation = 'destination-in';
        const grad = ctx.createRadialGradient(mx, my, cellSize * 0.8, mx, my, cellSize * 2.5);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawMaze(ctx);
      }
    }
  }, [maze, mouse, cellSize, isSurvivalMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onWallToggle || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellX = Math.floor(clickX / cellSize);
    const cellY = Math.floor(clickY / cellSize);

    if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) return;

    const offsetX = clickX % cellSize;
    const offsetY = clickY % cellSize;

    const threshold = cellSize * 0.25;

    const distN = offsetY;
    const distS = cellSize - offsetY;
    const distW = offsetX;
    const distE = cellSize - offsetX;

    const minDist = Math.min(distN, distS, distW, distE);

    if (minDist <= threshold) {
      if (minDist === distN) onWallToggle(cellX, cellY, Direction.North);
      else if (minDist === distS) onWallToggle(cellX, cellY, Direction.South);
      else if (minDist === distW) onWallToggle(cellX, cellY, Direction.West);
      else if (minDist === distE) onWallToggle(cellX, cellY, Direction.East);
    }
  };

  return (
    <div className="maze-renderer-container">
      <canvas
        ref={canvasRef}
        width={maze.width * cellSize}
        height={maze.height * cellSize}
        onClick={handleCanvasClick}
        style={{ border: '2px solid #444', borderRadius: '4px', cursor: onWallToggle ? 'crosshair' : 'default' }}
      />
    </div>
  );
};

export default MazeRenderer;
