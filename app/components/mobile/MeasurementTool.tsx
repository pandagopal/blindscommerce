import React, { useState, useRef, useEffect } from 'react';
import { Camera, Ruler, Save, Undo } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  points: Point[];
  distance: number; // in inches
  label: string;
}

export default function MeasurementTool() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [calibrationFactor, setCalibrationFactor] = useState<number>(1);
  const [currentLabel, setCurrentLabel] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isMobile) return;

    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraActive, isMobile]);

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
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentPoints(prev => [...prev, { x, y }]);

    if (currentPoints.length === 1) {
      // Calculate distance and save measurement
      const distance = calculateDistance(currentPoints[0], { x, y });
      const realDistance = distance * calibrationFactor;

      const newMeasurement: Measurement = {
        id: Date.now().toString(),
        points: [...currentPoints, { x, y }],
        distance: realDistance,
        label: currentLabel || `Measurement ${measurements.length + 1}`
      };

      setMeasurements(prev => [...prev, newMeasurement]);
      setCurrentPoints([]);
      setCurrentLabel('');
    }

    drawMeasurements();
  };

  const calculateDistance = (point1: Point, point2: Point): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const drawMeasurements = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw all measurements
    measurements.forEach(measurement => {
      drawMeasurement(ctx, measurement);
    });

    // Draw current measurement in progress
    if (currentPoints.length === 1) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
      ctx.stroke();
    }
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement) => {
    const [start, end] = measurement.points;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw measurement label
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(midX - 40, midY - 10, 80, 20);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${measurement.distance.toFixed(1)}"`, midX, midY + 5);
  };

  const handleCalibration = (knownDistance: number) => {
    if (measurements.length === 0) return;
    const lastMeasurement = measurements[measurements.length - 1];
    const pixelDistance = calculateDistance(lastMeasurement.points[0], lastMeasurement.points[1]);
    setCalibrationFactor(knownDistance / pixelDistance);
  };

  const undoLastMeasurement = () => {
    setMeasurements(prev => prev.slice(0, -1));
    drawMeasurements();
  };

  const saveMeasurements = async () => {
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurements }),
      });

      if (!response.ok) {
        throw new Error('Failed to save measurements');
      }

      // Clear measurements after saving
      setMeasurements([]);
      drawMeasurements();
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

  if (!isMobile) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">
          The mobile measurement tool is only available on mobile devices.
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
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Measurement Canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full"
        />

        {/* Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </Button>

            <Button
              onClick={undoLastMeasurement}
              disabled={measurements.length === 0}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>

            <Button
              onClick={saveMeasurements}
              disabled={measurements.length === 0}
              className="bg-primary-red text-white hover:bg-primary-red-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Calibration Input */}
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg">
            <Ruler className="w-4 h-4 text-gray-500" />
            <Input
              type="number"
              placeholder="Enter known distance (inches)"
              className="flex-1"
              onChange={(e) => handleCalibration(parseFloat(e.target.value))}
            />
          </div>

          {/* Measurement Label Input */}
          <Input
            value={currentLabel}
            onChange={(e) => setCurrentLabel(e.target.value)}
            placeholder="Enter measurement label (optional)"
            className="bg-white"
          />
        </div>
      </div>

      {/* Measurements List */}
      <div className="mt-4 bg-white rounded-lg p-4">
        <h3 className="font-medium mb-2">Saved Measurements</h3>
        <div className="space-y-2">
          {measurements.map((m) => (
            <div key={m.id} className="flex justify-between items-center">
              <span>{m.label}</span>
              <span className="font-medium">{m.distance.toFixed(1)}"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 