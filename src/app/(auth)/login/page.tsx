"use client";

import React from "react";

export default function Home() {
  const lines = Array.from({ length: 500 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="text-center">
        {lines.map((_, i) => (
          <p
            key={i}
            className="text-red-600 font-bold text-sm animate-pulse"
          >
            HACKEADO JOEL
          </p>
        ))}
      </div>
    </div>
  );
}
