"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.name = "NV_" + Date.now();

    const session = sessionStorage.getItem("user_session");

    if (session) {
      router.push("/seleccionemoduloacceso");
    }
  }, [router]);

  function cifrar(texto: string) {
    return btoa(texto);
  }

  async function comprobarclave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (usuario.trim() === "") {
      alert("El campo 'Usuario' es obligatorio");
      return;
    }

    if (clave.trim() === "") {
      alert("El campo 'Clave' es obligatorio");
      return;
    }

    setIsLoading(true);

    try {
      if (!db) {
        throw new Error("Firestore no disponible");
      }

      const usuarioLower = usuario.toLowerCase().trim();

      const userRef = doc(db, "usuarios", usuarioLower);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("El usuario no existe");
      }

      const userData = userSnap.data();

      if (userData.contrasena !== clave) {
        throw new Error("Contraseña incorrecta");
      }

      const jsessionid =
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2);

      await updateDoc(userRef, {
        sesion: jsessionid,
        ultimaConexion: new Date().toISOString(),
      });

      sessionStorage.setItem(
        "user_session",
        JSON.stringify({
          usuario: usuarioLower,
          sesion: jsessionid,
          displayName:
            userData.nombrePersona || usuarioLower,
        })
      );

      const claveCifrada = cifrar(clave);

      console.log("CLAVECIFRADA:", claveCifrada);

      setClave("");

      toast({
        title: "Acceso concedido",
        description: `Sesión ${jsessionid.substring(
          0,
          8
        )} iniciada`,
      });

      router.push("/seleccionemoduloacceso");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description:
          error.message || "Credenciales inválidas",
      });

      setIsLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: Arial, Helvetica, sans-serif;
          background: #ffffff;
        }

        table {
          border-collapse: collapse;
        }

        .morado {
          background-color: #9a6289;
        }

        .lila {
          background-color: #be9bb4;
        }

        .moradoclaro {
          background-color: #dbc6d4;
        }

        .verdeagua {
          background-color: #b7ddc8;
        }

        .verde {
          background-color: #b3d76b;
        }

        .naranja {
          background-color: #eab863;
        }

        input {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #573957;
          background-color: #dbc6d4;
          border: 1px solid #ffffff;
          padding: 5px;
          width: 170px;
          outline: none;
        }

        input:focus {
          background-color: #f1e5ed;
        }

        .usuario {
          font-size: 9pt;
          font-weight: bold;
          color: #ffffff;
        }

        .botones2 {
          background-color: #f0aa94;
          padding: 5px 14px;
          text-align: center;
          border: 1px #e77551 solid;
          font-size: 8pt;
          font-weight: bold;
          color: #903214;
          width: 120px;
          cursor: pointer;
        }

        .botones2:hover {
          background-color: #b3d76b;
          color: #000000;
        }

        .botones2:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rayuela-title {
          font-size: 38px;
          font-weight: bold;
          color: white;
          letter-spacing: -2px;
          padding-left: 30px;
        }

        .rayuela-subtitle {
          font-size: 12px;
          color: #ffffffcc;
          margin-top: 5px;
          padding-left: 32px;
        }

        .panel-text {
          font-size: 28px;
          font-weight: bold;
          color: #5f4157;
          padding: 10px 20px;
        }

        .footer-text {
          font-size: 13px;
          font-weight: bold;
          color: #5f4157;
          text-align: center;
          padding-top: 10px;
        }
      `}</style>

      <table width="100%" height="100%">
        <tbody>

          {/* CABECERA */}
          <tr height="170">

            <td colSpan={2} width="60%">
              <div
                style={{
                  paddingTop: "45px",
                }}
              >
                <div className="rayuela-title">
                  Rayuela
                </div>

                <div className="rayuela-subtitle">
                  Plataforma Educativa Extremeña
                </div>
              </div>
            </td>

            {/* LOGIN */}
            <td
              className="morado"
              width="30%"
              valign="top"
            >
              <table
                align="center"
                width="90%"
                cellPadding="0"
                cellSpacing="5"
                height="100%"
              >
                <tbody>
                  <tr>
                    <td align="center">

                      <form onSubmit={comprobarclave}>

                        <table align="center">
                          <tbody>

                            <tr align="center">
                              <td className="usuario">

                                Usuario
                                <br />

                                <input
                                  type="text"
                                  autoComplete="username"
                                  value={usuario}
                                  onChange={(e) =>
                                    setUsuario(
                                      e.target.value
                                    )
                                  }
                                />

                              </td>
                            </tr>

                            <tr align="center">
                              <td className="usuario">

                                <br />

                                Contraseña
                                <br />

                                <input
                                  type="password"
                                  autoComplete="current-password"
                                  value={clave}
                                  onChange={(e) =>
                                    setClave(
                                      e.target.value
                                    )
                                  }
                                />

                              </td>
                            </tr>

                            <tr>
                              <td height="25"></td>
                            </tr>

                            <tr align="center">
                              <td>

                                <button
                                  type="submit"
                                  className="botones2"
                                  disabled={isLoading}
                                >
                                  {isLoading
                                    ? "Conectando..."
                                    : "Entrar"}
                                </button>

                              </td>
                            </tr>

                          </tbody>
                        </table>

                      </form>

                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td width="10%"></td>
          </tr>

          {/* BLOQUE LILA */}
          <tr height="100">

            <td
              colSpan={2}
              className="lila"
            >
              <div className="panel-text">
                Gestión de Centros
              </div>
            </td>

            <td className="moradoclaro">
              <div className="panel-text">
                RAY
              </div>
            </td>

            <td className="lila">
              <div className="panel-text">
                UELA
              </div>
            </td>

          </tr>

          {/* BLOQUE VERDE */}
          <tr height="65">

            <td colSpan={2}></td>

            <td className="verdeagua">
              <div className="panel-text">
                Plataforma
              </div>
            </td>

            <td className="verde">
              <div className="panel-text">
                Educativa
              </div>
            </td>

          </tr>

          {/* BLOQUE NARANJA */}
          <tr height="25">

            <td colSpan={2}></td>

            <td className="naranja"></td>

            <td>
              <div className="footer-text">
                Extremadura
              </div>
            </td>

          </tr>

          {/* FOOTER */}
          <tr>

            <td colSpan={2}></td>

            <td className="naranja"></td>

            <td align="center">

              <div
                className="footer-text"
                style={{
                  paddingBottom: "30px",
                }}
              >
                Junta de Extremadura
                <br />
                Fondo Europeo FEDER
              </div>

            </td>

          </tr>

        </tbody>
      </table>
    </>
  );
}
