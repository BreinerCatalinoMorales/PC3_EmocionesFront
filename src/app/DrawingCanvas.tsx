"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Send, Trash2, Undo } from "lucide-react";
import { downloadFile } from "@/lib/downloads";

const BASE_URL = "web-production-a509a.up.railway.app";

const COLORS = [
  { name: "rojo", hex: "#FF0000" },
  { name: "azul", hex: "#0000FF" },
  { name: "verde", hex: "#00FF00" },
];

export default function DrawingCanvas({
  randomNumber,
  setRandomNumber,
}: {
  randomNumber: number;
  setRandomNumber: (randomNumber: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);

  useEffect(() => {
    fetch(`${BASE_URL}/total-images`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener el total de imágenes");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Total de imágenes:", data);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ✅ Canvas interno de 32x32 píxeles
    canvas.width = 32;
    canvas.height = 32;
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 32, 32);
    
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
    setHistory((prev) => [...prev, imageData]);
    setHistoryIndex((prev) => prev + 1);
  };

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
    ctx.strokeStyle = currentColor.hex;
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
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const undoLastAction = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    setHistoryIndex((prev) => prev - 1);
    ctx.putImageData(history[historyIndex - 1], 0, 0);
  };

  const prepareData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/prepare`, { method: "GET" });
      if (response.ok) {
        const result = await response.json();
        alert("Datos preparados correctamente.");
        console.log(result);
      } else {
        alert("Hubo un problema al preparar los datos.");
      }
    } catch (error) {
      console.error("Error al preparar los datos:", error);
      alert("Error al preparar los datos.");
    }
  };

  const downloadX = async () => {
    await downloadFile(`${BASE_URL}/X.npy`, "X.npy");
  };

  const downloadY = async () => {
    await downloadFile(`${BASE_URL}/y.npy`, "y.npy");
  };

  const sendDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png");
    const response = await fetch(`${BASE_URL}/save-drawing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        image: dataURL, 
        category: randomNumber,
        color: currentColor.name 
      }),
    });

    if (response.ok) {
      alert("Imagen enviada y guardada correctamente.");
      clearCanvas();
      setRandomNumber(Math.floor(Math.random() * 3));
    } else {
      alert("Error al guardar la imagen.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`max-w-fit bg-white rounded-lg shadow-lg overflow-hidden border-4 ${
          randomNumber === 0
            ? "border-amber-400"
            : randomNumber === 1
            ? "border-blue-400"
            : "border-red-400"
        }`}
      >
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


      <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          Selecciona un color:
        </p>
        <div className="flex gap-3">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setCurrentColor(color)}
              className={`w-16 h-16 rounded-lg border-4 transition-all hover:scale-110 ${
                currentColor.name === color.name
                  ? "border-gray-800 shadow-lg scale-110"
                  : "border-gray-300"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
            />
          ))}
        </div>
        <p className="text-xs font-mono text-gray-600">
          Color actual: <span className="font-bold">{currentColor.name}</span>
        </p>
      </div>

      <TooltipProvider>
        <div className="flex flex-wrap justify-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={`bg-white hover:bg-amber-100 border-amber-400`}
                onClick={undoLastAction}
              >
                <Undo className="h-5 w-5 mr-2" />
                <span>Deshacer</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Retrocede un paso, pe</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="bg-white hover:bg-red-100 border-red-400"
                onClick={clearCanvas}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                <span>Borrar todo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Borra todo al toque</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={sendDrawing}
              >
                <Send className="h-5 w-5 mr-2" />
                <span>Enviar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manda tu chamba, causa</p>
            </TooltipContent>
          </Tooltip>

          <div className="space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={prepareData}
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span>Prepara los datos</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Prepara el dataset</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={downloadX}
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span>Descargar X.npy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descarga el dataset X</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={downloadY}
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span>Descargar y.npy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descarga el dataset y</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      <p className="text-sm text-amber-700 italic mt-2">
        Dibuja tus emociones y compártelas
      </p>
    </div>
  );
}
