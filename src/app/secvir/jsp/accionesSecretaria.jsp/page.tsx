"use client";

import { useEffect, useState } from "react";
import { app } from "@/firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(app);

export default function Page() {
  const [tramites, setTramites] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTramites();
  }, []);

  async function cargarTramites() {
    try {
      const snap = await getDocs(collection(db, "tramites"));

      const lista = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTramites(lista);

      if (lista.length > 0) {
        setSeleccionado(lista[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function abrir(url) {
    window.location.href = url;
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family: Inter, Arial, Helvetica, sans-serif;
          background: linear-gradient(135deg, #f7f7ff, #eef2ff);
          color: #1e1e1e;
        }

        body {
          min-height: 100vh;
        }

        .wrapper {
          max-width: 1450px;
          margin: auto;
          padding: 30px;
        }

        .header {
          background: white;
          border-radius: 22px;
          padding: 22px 30px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.07);
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .brand {
          display: flex;
          flex-direction: column;
        }

        .brand small {
          color: #7c7c7c;
          font-size: 13px;
        }

        .brand h1 {
          margin: 0;
          font-size: 30px;
          color: #6f2dbd;
        }

        .badge {
          background: #f2e9ff;
          color: #6f2dbd;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
        }

        .layout {
          display: grid;
          grid-template-columns: 370px 1fr 320px;
          gap: 22px;
        }

        .card {
          background: white;
          border-radius: 22px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.06);
          padding: 24px;
        }

        .title {
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 18px;
          color: #6f2dbd;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 72vh;
          overflow-y: auto;
          padding-right: 5px;
        }

        .item {
          border: 1px solid #ececec;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: 0.2s ease;
          background: #fafafa;
        }

        .item:hover {
          transform: translateY(-2px);
          border-color: #d4b8ff;
          background: #ffffff;
        }

        .item.active {
          border-color: #6f2dbd;
          background: linear-gradient(
            135deg,
            #f6efff,
            #ffffff
          );
        }

        .item span {
          display: block;
          color: #999;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .item strong {
          font-size: 15px;
          line-height: 1.4;
        }

        .empty {
          color: #888;
          line-height: 1.6;
        }

        .detailTitle {
          font-size: 28px;
          font-weight: 900;
          color: #202020;
          margin-bottom: 14px;
        }

        .detailDesc {
          color: #555;
          font-size: 16px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .cta {
          width: 100%;
          border: none;
          background: linear-gradient(
            135deg,
            #6f2dbd,
            #9d4edd
          );
          color: white;
          font-weight: 800;
          padding: 15px;
          border-radius: 16px;
          cursor: pointer;
          font-size: 16px;
          transition: 0.2s;
        }

        .cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(111, 45, 189, 0.25);
        }

        .help {
          margin-top: 18px;
          padding: 18px;
          border-radius: 18px;
          background: #faf7ff;
        }

        .help h3 {
          margin: 0 0 8px;
          color: #6f2dbd;
        }

        .phone {
          font-size: 28px;
          font-weight: 900;
          color: #ff3b30;
          margin-top: 10px;
        }

        .phone a {
          color: inherit;
          text-decoration: none;
        }

        .loading {
          color: #666;
          font-size: 15px;
        }

        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="wrapper">
        <div className="header">
          <div className="brand">
            <small>Secretaría Virtual</small>
            <h1>RAYUELA · Trámites</h1>
          </div>

          <div className="badge">
            Junta de Extremadura
          </div>
        </div>

        <div className="layout">
          <div className="card">
            <div className="title">
              Trámites disponibles
            </div>

            {loading ? (
              <div className="loading">
                Cargando trámites...
              </div>
            ) : (
              <div className="list">
                {tramites.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSeleccionado(item)
                    }
                    className={
                      "item " +
                      (seleccionado?.id === item.id
                        ? "active"
                        : "")
                    }
                  >
                    <span>
                      Trámite {i + 1}
                    </span>

                    <strong>
                      {item.nombreTramite}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            {!seleccionado ? (
              <>
                <div className="title">
                  Información
                </div>

                <div className="empty">
                  Selecciona un trámite de la
                  columna izquierda para ver
                  su descripción.
                </div>
              </>
            ) : (
              <>
                <div className="detailTitle">
                  {seleccionado.nombreTramite}
                </div>

                <div className="detailDesc">
                  {seleccionado.descripcionTramite}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="title">
              Acciones
            </div>

            {seleccionado ? (
              <button
                className="cta"
                onClick={() =>
                  abrir(
                    seleccionado.urlTramite
                  )
                }
              >
                Presentar solicitud
              </button>
            ) : (
              <div className="empty">
                Selecciona un trámite.
              </div>
            )}

            <div className="help">
              <h3>Centro de ayuda</h3>
              <div>
                Soporte técnico oficial
              </div>

              <div className="phone">
                <a href="tel:924004050">
                  924 00 40 50
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
