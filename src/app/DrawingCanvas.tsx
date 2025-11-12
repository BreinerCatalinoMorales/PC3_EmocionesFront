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

  useEffect(() => {
    fetch("https://web-production-d267c.up.railway.app/total-images")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener el total de imágenes");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Total de imágenes:", data);
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(500, window.innerHeight - 200);

        // Save initial state
        saveState();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // If we're not at the end of the history, remove everything after current index
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }

    setHistory((prev) => [...prev, imageData]);
    setHistoryIndex((prev) => prev + 1);
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    setIsDrawing(true);

    let x, y;
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let x, y;
    if ("touches" in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    saveState();
  };

  const undoLastAction = () => {
    if (historyIndex <= 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    setHistoryIndex((prev) => prev - 1);
    ctx.putImageData(history[historyIndex - 1], 0, 0);
  };

  const prepareData = async () => {
    try {
      const response = await fetch(
        "https://web-production-d267c.up.railway.app/prepare",
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert("Datos preparados correctamente.");
        console.log(result); // para ver los detalles si los devuelve
      } else {
        alert("Hubo un problema al preparar los datos.");
      }
    } catch (error) {
      console.error("Error al preparar los datos:", error);
      alert("Error al preparar los datos.");
    }
  };

  const downloadX = async () => {
    await downloadFile(
      "https://web-production-d267c.up.railway.app/X.npy",
      "X.npy"
    );
  };

  const downloadY = async () => {
    await downloadFile(
      "https://web-production-d267c.up.railway.app/y.npy",
      "y.npy"
    );
  };

  const sendDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png");
    const response = await fetch(
      "https://web-production-d267c.up.railway.app/save-drawing",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataURL,
          category: randomNumber, // 0, 1, 2
        }),
      }
    );

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
        className={`w-full bg-white rounded-lg shadow-lg overflow-hidden border-4 ${
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
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
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
                <p>Descarga el dataset X</p>
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
