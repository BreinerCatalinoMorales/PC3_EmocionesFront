"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Send } from "lucide-react";
import Link from "next/link";

const BASE_URL = "http://192.168.1.104:5000"; // Tu backend

export default function PredictPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<{
    emotion: string;
    confidence: number;
    model_type?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas de 32x32 píxeles
    canvas.width = 32;
    canvas.height = 32;
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 32, 32);
  }, []);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: x * scaleX,
      y: y * scaleY
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000"; // Negro para predicción
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if ("touches" in e) {
      e.preventDefault();
    }

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

  const predictEmotion = async (modelType: 'normal' | 'pretrained') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setPrediction(null);

    try {
      const dataURL = canvas.toDataURL("image/png");
      
      const response = await fetch(`${BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: dataURL,
          model_type: modelType // 'normal' o 'pretrained'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPrediction(result);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo predecir'}`);
      }
    } catch (error) {
      console.error("Error al predecir:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: { [key: string]: string } = {
      'alegria': '😊',
      'tristeza': '😢',
      'enojo': '😠'
    };
    return emojis[emotion.toLowerCase()] || '🤔';
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      'alegria': 'text-yellow-600 bg-yellow-50 border-yellow-300',
      'tristeza': 'text-blue-600 bg-blue-50 border-blue-300',
      'enojo': 'text-red-600 bg-red-50 border-red-300'
    };
    return colors[emotion.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            🎨 Predictor de Emociones
          </h1>
          <div className="w-24"></div> {/* Spacer para centrar */}
        </div>

        {/* Instrucciones */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📝 Instrucciones
          </h2>
          <p className="text-gray-600">
            Dibuja una de las siguientes emociones en el canvas:
          </p>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="text-center">
              <div className="text-4xl mb-1">😊</div>
              <p className="text-sm font-medium">Feliz</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">😢</div>
              <p className="text-sm font-medium">Triste</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">😠</div>
              <p className="text-sm font-medium">Enojado</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-center mb-4">
            <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="touch-none cursor-crosshair"
                style={{ 
                  width: '320px',
                  height: '320px',
                  imageRendering: 'pixelated',
                  display: 'block'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={clearCanvas}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Borrar
            </Button>
            
            <Button
              onClick={() => predictEmotion('normal')}
              disabled={isLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Prediciendo...' : 'Predecir (Modelo Normal)'}
            </Button>

            <Button
              onClick={() => predictEmotion('pretrained')}
              disabled={isLoading}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Prediciendo...' : 'Predecir (Pre-entrenado)'}
            </Button>
          </div>
        </div>

        {/* Resultado */}
        {prediction && (
          <div className={`rounded-lg shadow-lg p-6 border-2 ${getEmotionColor(prediction.emotion)}`}>
            <h3 className="text-2xl font-bold mb-4 text-center">
              Resultado de la Predicción
            </h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-6xl">
                {getEmotionEmoji(prediction.emotion)}
              </div>
              <div>
                <p className="text-3xl font-bold capitalize">
                  {prediction.emotion}
                </p>
                <p className="text-lg">
                  Confianza: {(prediction.confidence * 100).toFixed(2)}%
                </p>
                {prediction.model_type && (
                  <p className="text-sm mt-1 opacity-75">
                    Modelo: {prediction.model_type === 'normal' ? 'Normal' : 'Pre-entrenado con MNIST'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
