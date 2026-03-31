import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface FaceControllerProps {
  onCommand: (cmd: 'left' | 'right' | 'forward' | 'none') => void;
  enabled: boolean;
  lang: 'ja' | 'en';
}

const FaceController: React.FC<FaceControllerProps> = ({ onCommand, enabled, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [yawValue, setYawValue] = useState<number>(0);
  
  // Deadzone and sensitivity
  const YAW_THRESHOLD = 0.25;

  useEffect(() => {
    if (!enabled) {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
         videoRef.current.srcObject = null;
      }
      return;
    }

    async function setupTracker() {
      try {
        setStatus('loading');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStatus('active');
            requestAnimationFrame(predictLoop);
          };
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }

    let lastTime = -1;
    function predictLoop() {
      if (!enabled || !videoRef.current || !landmarkerRef.current || !canvasRef.current) return;

      const startTimeMs = performance.now();
      if (videoRef.current.currentTime !== lastTime) {
        lastTime = videoRef.current.currentTime;
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Indices for calculation
          // Nose tip: 4
          // Left eye inner: 133
          // Right eye inner: 362
          const nose = landmarks[4];
          const leftEye = landmarks[133];
          const rightEye = landmarks[362];

          // Calculate Yaw
          // This is a heuristic: how far is the nose from the center of eyes normalized by eye distance
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeDist = Math.abs(rightEye.x - leftEye.x);
          const yaw = (nose.x - eyeCenterX) / eyeDist;
          
          setYawValue(yaw);

          // Command logic
          if (yaw < -YAW_THRESHOLD) {
            onCommand('left');
          } else if (yaw > YAW_THRESHOLD) {
            onCommand('right');
          } else {
            onCommand('forward');
          }

          // Draw feedback
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            // Draw indicators
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            
            // Mirroring the landmarks for display
            const drawX = (x: number) => canvasRef.current!.width * (1 - x);
            const drawY = (y: number) => canvasRef.current!.height * y;

            ctx.beginPath();
            ctx.arc(drawX(nose.x), drawY(nose.y), 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(drawX(leftEye.x), drawY(leftEye.y));
            ctx.lineTo(drawX(rightEye.x), drawY(rightEye.y));
            ctx.stroke();
          }
        } else {
          onCommand('none');
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      requestAnimationFrame(predictLoop);
    }

    setupTracker();
    return () => {
      // Cleanup
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '160px',
      height: '120px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid #FFD700',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backgroundColor: '#000',
      zIndex: 1000
    }}>
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} width={160} height={120} style={{ position: 'absolute', top: 0, left: 0 }} />
      
      <div style={{
        position: 'absolute',
        top: '4px',
        left: '4px',
        fontSize: '10px',
        color: '#FFD700',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '2px 4px',
        borderRadius: '4px'
      }}>
        {status === 'loading' ? (lang === 'ja' ? '読み込み中...' : 'Loading...') : 'FACE CAM'}
      </div>

      {status === 'active' && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: '2px'
        }}>
          <div style={{ 
            width: '30%', height: '4px', 
            backgroundColor: yawValue < -YAW_THRESHOLD ? '#FF5252' : 'rgba(255,255,255,0.2)' 
          }} />
          <div style={{ 
            width: '30%', height: '4px', 
            backgroundColor: Math.abs(yawValue) <= YAW_THRESHOLD ? '#4CAF50' : 'rgba(255,255,255,0.2)' 
          }} />
          <div style={{ 
            width: '30%', height: '4px', 
            backgroundColor: yawValue > YAW_THRESHOLD ? '#FF5252' : 'rgba(255,255,255,0.2)' 
          }} />
        </div>
      )}
    </div>
  );
};

export default FaceController;
