import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { apiRateLimiter } from '@/lib/security/validation';

interface ARPreviewProps {
  productId: string;
  productImage: string;
  productDimensions: {
    width: number;
    height: number;
  };
}

export default function ARPreview({ productId, productImage, productDimensions }: ARPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // Check if WebXR is supported with security validation
    if ('xr' in navigator && typeof (navigator as any).xr?.isSessionSupported === 'function') {
      (navigator as any).xr.isSessionSupported('immersive-ar')
        .then((supported: boolean) => {
          setIsARSupported(supported);
        })
        .catch((error: Error) => {
          // Safe error logging
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error checking AR support:', error);
          }
          setIsARSupported(false);
        });
    } else {
      setIsARSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    if (isARActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isARActive, isMobile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraReady(false);
    }
  };

  const startARSession = async () => {
    if (!isARSupported) return;

    try {
      const session = await (navigator as any).xr?.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });

      // Initialize WebXR session
      session.addEventListener('end', () => {
        setIsARActive(false);
      });

      // Set up WebGL context and start render loop
      const gl = canvasRef.current?.getContext('webgl');
      if (!gl) return;

      // Initialize WebGL resources
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) return;
      gl.shaderSource(vertexShader, `
        attribute vec4 position;
        attribute vec2 texcoord;
        varying vec2 vTexCoord;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        void main() {
          vTexCoord = texcoord;
          gl_Position = projectionMatrix * modelViewMatrix * position;
        }
      `);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) return;
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform sampler2D diffuse;
        void main() {
          gl_FragColor = texture2D(diffuse, vTexCoord);
        }
      `);
      gl.compileShader(fragmentShader);

      // Create shader program
      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Load product texture
      const texture = gl.createTexture();
      const image = new Image();
      image.src = productImage;
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };

      // Start render loop
      const onXRFrame = (time: number, frame: any) => {
        session.requestAnimationFrame(onXRFrame);

        const pose = frame.getViewerPose(referenceSpace);
        if (!pose) return;

        // Render AR content
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const view of pose.views) {
          const viewport = session.renderState.baseLayer.getViewport(view);
          gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

          // Update uniforms and render
          // ... (WebGL rendering code)
        }
      };

      session.requestAnimationFrame(onXRFrame);
    } catch (error) {
      console.error('Error starting AR session:', error);
    }
  };

  if (!isMobile) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">
          AR preview is only available on mobile devices.
          Please visit this page on your smartphone or tablet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
        {/* Camera Preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${isARActive ? 'block' : 'hidden'}`}
        />

        {/* AR Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* AR Overlay */}
        <div id="ar-overlay" className="absolute inset-0">
          {/* AR UI elements will be rendered here */}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
          <Button
            onClick={() => setIsARActive(!isARActive)}
            className="bg-white text-gray-900 hover:bg-gray-100"
            disabled={!isARSupported}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isARActive ? 'Stop AR' : 'Start AR'}
          </Button>

          {isARActive && (
            <Button
              onClick={() => {/* Reset AR position */}}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reset Position
            </Button>
          )}
        </div>
      </div>

      {!isARSupported && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800">
            AR preview is not supported on your device.
            Please ensure you have an AR-capable device and browser.
          </p>
        </div>
      )}
    </div>
  );
} 