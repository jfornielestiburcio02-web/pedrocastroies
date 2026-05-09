"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

declare global {
  interface Window {
    cifrar?: (text: string) => string;
  }
}

export default function Page() {
  const router = useRouter();
  const db = useFirestore();

  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("user_session");

    if (session) {
      router.push("/seleccionemoduloacceso");
    }
  }, [router]);

  const comprobarclave = async () => {
    if (usuario.trim() === "") {
      alert("El campo 'Usuario' es obligatorio");
      return;
    }

    if (clave.trim() === "") {
      alert("El campo 'Clave' es obligatorio");
      return;
    }

    if (!db) return;

    setLoading(true);

    try {
      const usuarioLower = usuario.toLowerCase().trim();

      const userRef = doc(db, "usuarios", usuarioLower);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("El usuario no existe");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      let claveFinal = clave;

      // Si existe función de cifrado
      if (typeof window.cifrar === "function") {
        claveFinal = window.cifrar(clave);
      }

      if (
        userData.contrasena !== clave &&
        userData.contrasena !== claveFinal
      ) {
        alert("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Generar sesión tipo JSESSIONID
      const jsessionid =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Guardar sesión en Firestore
      await updateDoc(userRef, {
        sesion: jsessionid,
      });

      // SessionStorage
      sessionStorage.setItem(
        "user_session",
        JSON.stringify({
          usuario: usuarioLower,
          sesion: jsessionid,
          displayName:
            userData.nombrePersona || userData.usuario || usuarioLower,
        })
      );

      router.push("/seleccionemoduloacceso");
    } catch (error) {
      console.error(error);
      alert("Error interno del sistema");
    }

    setLoading(false);
  };

  return (
    <>
      <Script
        src="/scripts/consejeria/cifrado.js"
        strategy="beforeInteractive"
      />

      <style>{`
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: Arial;
        }

        table {
          border-collapse: collapse;
        }

        .morado { background-color: #9A6289 }
        .lila { background-color: #BE9BB4 }
        .moradoclaro { background-color: #DBC6D4 }
        .verdeagua { background-color: #B7DDC8 }
        .verde { background-color: #B3D76B }
        .naranja { background-color: #EAB863 }

        input {
          font-family: Arial;
          font-size: 8pt;
          font-weight: bold;
          color: #573957;
          background-color: #DBC6D4;
          border: 1px solid #fff;
          padding: 3px;
          width: 160px;
        }

        .usuario {
          font-family: Arial;
          font-size: 9pt;
          font-weight: bold;
          color: #FFFFFF;
        }

        .botones2 {
          background-color: #F0AA94;
          padding: 6px 20px;
          border: 1px #E77551 solid;
          font-family: Arial;
          font-size: 10pt;
          font-weight: bold;
          color: #903214;
          cursor: pointer;
          display: inline-block;
          user-select: none;
        }

        .botones2:hover {
          background-color: #B3D76B;
          color: #000;
        }
      `}</style>

      <table width="100%" height="100vh">
        <tbody>

          {/* FILA 1 */}
          <tr height="165">
            <td colSpan={2} width="60%">
              <img src="/images/puertaTrasera/logo_rayuela.gif" />
            </td>

            <td className="morado" width="30%" valign="top">
              <table width="100%" height="100%">
                <tbody>
                  <tr>
                    <td align="center">

                      <div className="usuario">
                        Usuario
                        <br />

                        <input
                          type="text"
                          value={usuario}
                          onChange={(e) => setUsuario(e.target.value)}
                        />
                      </div>

                      <div
                        className="usuario"
                        style={{ marginTop: 10 }}
                      >
                        Contraseña
                        <br />

                        <input
                          type="password"
                          value={clave}
                          onChange={(e) => setClave(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              comprobarclave();
                            }
                          }}
                        />
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <span
                          className="botones2"
                          onClick={comprobarclave}
                        >
                          {loading ? "Conectando..." : "Entrar"}
                        </span>
                      </div>

                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td width="10%"></td>
          </tr>

          {/* FILA 2 */}
          <tr height="100">
            <td colSpan={2} className="lila">
              <table width="100%" height="100%">
                <tbody>
                  <tr align="center">
                    <td></td>

                    <td>
                      <img src="/images/puertaTrasera/menu_GESTION_CENTROS.gif" />
                    </td>

                    <td></td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td className="moradoclaro">
              <img src="/images/puertaTrasera/txt_ray.gif" />
            </td>

            <td className="lila">
              <img src="/images/puertaTrasera/txt_uela.gif" />
            </td>
          </tr>

          {/* FILA 3 */}
          <tr height="63">
            <td colSpan={2}></td>

            <td className="verdeagua">
              <img src="/images/puertaTrasera/tit_plataforma.gif" />
            </td>

            <td className="verde">
              <img src="/images/puertaTrasera/tit_educativa.gif" />
            </td>
          </tr>

          {/* FILA 4 */}
          <tr height="21">
            <td colSpan={2}></td>

            <td className="naranja"></td>

            <td>
              <img src="/images/puertaTrasera/tit_extrem.gif" />
            </td>
          </tr>

          {/* FILA FINAL */}
          <tr>
            <td colSpan={2}></td>

            <td className="naranja" style={{ height: "100%" }}></td>

            <td align="center">
              <img src="/images/puertaTrasera/logo_junta.gif" />
              <br />
              <img src="/images/puertaTrasera/FEDER-UE.jpg" />
            </td>
          </tr>

        </tbody>
      </table>
    </>
  );
}
