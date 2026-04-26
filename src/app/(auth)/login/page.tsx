"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [hasCrashed, setHasCrashed] = useState(false);

  useEffect(() => {
    // Esto se ejecuta una sola vez al cargar
    setHasCrashed(true);
  }, []);

  if (hasCrashed) {
    // Esto detiene el renderizado y lanza el error 500/502
    // En producción verás una pantalla blanca o la de error por defecto
    throw new Error("502 Bad Gateway");
  }

  // Mientras no ha crasheado (milisegundos), devuelve un fragmento vacío (pantalla blanca)
  return null;
}
