"use client";
import { useEffect, useState } from "react";
import DrawingCanvas from "./DrawingCanvas";
import Image from "next/image";

const EMOCIONES = ["Alegría 🙂​", "Tristeza ☹️​", "Enojo 😠​"];

export default function Home() {
  const [randomNumber, setRandomNumber] = useState<number>();

  useEffect(() => {
    const random = Math.floor(Math.random() * 3);
    setRandomNumber(random);
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-4 ${
        randomNumber === 0
          ? "bg-amber-100"
          : randomNumber === 1
          ? "bg-blue-100"
          : "bg-red-100"
      }`}
    >
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-center">
          <Image
            src={
              randomNumber === 0
                ? "/img1.png"
                : randomNumber === 1
                ? "/img3.png"
                : "/img2.png"
            }
            alt="Emoción"
            width={100}
            height={100}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-amber-800">
            Dibuja tu emoción como el emoji:{" "}
            {randomNumber !== undefined ? EMOCIONES[randomNumber] : "..."}
          </h1>
        </div>

        {randomNumber !== undefined && (
          <DrawingCanvas
            randomNumber={randomNumber}
            setRandomNumber={setRandomNumber}
          />
        )}
      </div>
    </main>
  );
}
