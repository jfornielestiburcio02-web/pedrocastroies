"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Page() {
  const [tramites, setTramites] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    cargarTramites();
  }, []);

  async function cargarTramites() {
    const snap = await getDocs(collection(db, "tramites"));
    const datos = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setTramites(datos);
  }

  function abrirTramite(url) {
    window.location.href = url;
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: white;
        }

        .tabla {
          width: 100%;
          border-collapse: collapse;
        }

        .cabecera {
          height: 85px;
        }

        .izquierda {
          width: 25%;
          vertical-align: top;
          border-right: 1px solid #ddd;
          padding: 15px;
        }

        .centro {
          width: 50%;
          vertical-align: top;
          padding: 20px;
        }

        .derecha {
          width: 25%;
          vertical-align: top;
          padding: 20px;
        }

        .tramite {
          padding: 12px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          cursor: pointer;
          transition: 0.2s;
          background: #fafafa;
        }

        .tramite:hover {
          background: #f1f1f1;
        }

        .activo {
          border-color: #803182;
          background: #f6edfa;
        }

        .titulo {
          font-size: 24px;
          color: #803182;
          font-weight: bold;
          margin-bottom: 15px;
        }

        .descripcion {
          font-size: 16px;
          line-height: 1.5;
        }

        .boton {
          margin-top: 20px;
          background: #803182;
          color: white;
          border: none;
          padding: 12px 18px;
          cursor: pointer;
          font-weight: bold;
          border-radius: 4px;
        }

        .boton:hover {
          background: #69256d;
        }

        .logo {
          width: 220px;
        }

        .rayuela {
          width: 120px;
        }

        .telefono {
          color: red;
          font-size: 28px;
          margin-top: 20px;
        }

        a {
          color: red;
          text-decoration: none;
        }
      `}</style>

      <table className="tabla">
        <tbody>
          <tr className="cabecera">
            <td width="2%"></td>

            <td width="24%">
              <img
                src="/images/log_extremadura.png"
                className="logo"
                alt=""
              />
            </td>

            <td width="40%"></td>

            <td align="right">
              <img
                src="/images/rayuela.png"
                className="rayuela"
                alt=""
              />
            </td>

            <td width="10"></td>
          </tr>
        </tbody>
      </table>

      <table className="tabla">
        <tbody>
          <tr>
            <td className="izquierda">
              <div className="titulo">Trámites</div>

              {tramites.map((item, index) => (
                <div
                  key={item.id}
                  className={
                    "tramite " +
                    (seleccionado?.id === item.id ? "activo" : "")
                  }
                  onClick={() => setSeleccionado(item)}
                >
                  <strong>{index + 1}. {item.nombreTramite}</strong>
                </div>
              ))}
            </td>

            <td className="centro">
              {!seleccionado && (
                <>
                  <div className="titulo">
                    Selecciona un trámite
                  </div>

                  <div className="descripcion">
                    Elige un trámite del menú izquierdo para ver su
                    información y acceder.
                  </div>
                </>
              )}

              {seleccionado && (
                <>
                  <div className="titulo">
                    {seleccionado.nombreTramite}
                  </div>

                  <div className="descripcion">
                    {seleccionado.descripcionTramite}
                  </div>
                </>
              )}
            </td>

            <td className="derecha">
              {seleccionado && (
                <button
                  className="boton"
                  onClick={() =>
                    abrirTramite(
                      seleccionado.urlTramite
                    )
                  }
                >
                  Presentar solicitud
                </button>
              )}

              <div className="telefono">
                <a href="tel:924004050">
                  924 00 40 50
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
