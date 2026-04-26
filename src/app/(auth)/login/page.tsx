"use client";

import React from "react";

export default function Home() {
  const lines = Array.from({ length: 500 });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-sans">
      {/* Sección del Error 500 / Bad Gateway */}
      <div className="text-center z-10 bg-white p-10">
        <h1 className="text-4xl font-bold">502 Bad Gateway</h1>
        <hr className="my-4 border-gray-300 w-full" />
        <p className="text-xl">nginx</p>
      </div>

      {/* Tu efecto de texto de fondo */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        {lines.map((_, i) => (
          <p
            key={i}
            className="text-red-600 font-bold text-xs animate-pulse inline-block m-1"
          >
            ngix
          </p>
        ))}
      </div>
    </div>
  );
}
