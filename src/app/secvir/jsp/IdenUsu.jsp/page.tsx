"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("16829");
  const [claveCifrada, setClaveCifrada] = useState("16829");
  const [error, setError] = useState(false);

  useEffect(() => {
    window.name = "NV_1777295521425";
  }, []);

  function cifrar(texto) {
    return btoa(texto);
  }

  function comprobarclave(e) {
    e.preventDefault();

    if (usuario === "") {
      alert("El campo 'Usuario' es obligatorio");
      return;
    }

    if (clave === "") {
      alert("El campo 'Clave' es obligatorio");
      return;
    }

    const cifrada = cifrar(clave);
    setClaveCifrada(cifrada);
    setClave("");

    // SIMULACIÓN LOGIN INCORRECTO
    setError(true);
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
          background: #ffffff;
        }

        table {
          border-collapse: collapse;
        }

        .morado {
          background: #9a6289;
        }

        .lila {
          background: #be9bb4;
        }

        .moradoclaro {
          background: #dbc6d4;
        }

        .verdeagua {
          background: #b7ddc8;
        }

        .verde {
          background: #b3d76b;
        }

        .naranja {
          background: #eab863;
        }

        input {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #573957;
          background: #dbc6d4;
          border: 1px solid #fff;
        }

        .usuario {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          font-weight: bold;
          color: white;
        }

        .txtmensajeerror {
          color: #ff9900;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          padding: 4px 4px 4px 10px;
          text-align: justify;
          margin-bottom: 10px;
        }

        .botones2 {
          background: #f0aa94;
          border: 1px solid #e77551;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #903214;
          padding: 4px 20px;
          cursor: pointer;
        }

        .botones2:hover {
          background: #b3d76b;
          color: #000;
        }
      `}</style>

      <table width="100%" height="100%">
        <tbody>
          <tr>
            <td colSpan="2" width="60%">
              <table width="100%">
                <tbody>
                  <tr>
                    <td>
                      <img
                        src="/images/logo_rayuela.gif"
                        width="230"
                        height="157"
                        alt=""
                      />
                    </td>
                    <td align="right" valign="bottom">
                      &nbsp;
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td className="morado" width="30%" valign="top">
              <table align="center" width="90%">
                <tbody>
                  <tr>
                    <td>
                      {error && (
                        <div className="txtmensajeerror">
                          El usuario, la contraseña o ambos son incorrectos,
                          puede pedir nuevas contraseñas pulsando en la opción
                          'Solicitar nuevas contraseñas' o poniéndose en contacto
                          con el C.A.U.
                        </div>
                      )}

                      <form onSubmit={comprobarclave}>
                        <table align="center">
                          <tbody>
                            <tr align="center">
                              <td className="usuario">
                                Usuario
                                <br />
                                <input
                                  value={usuario}
                                  onChange={(e) =>
                                    setUsuario(e.target.value)
                                  }
                                  size="20"
                                  type="text"
                                />
                              </td>
                            </tr>

                            <tr align="center">
                              <td className="usuario">
                                <br />
                                Contraseña
                                <br />
                                <input
                                  value={clave}
                                  onChange={(e) =>
                                    setClave(e.target.value)
                                  }
                                  size="20"
                                  type="password"
                                />
                                <input
                                  type="hidden"
                                  value={claveCifrada}
                                  readOnly
                                />
                              </td>
                            </tr>

                            <tr>
                              <td>&nbsp;</td>
                            </tr>

                            <tr align="center">
                              <td>
                                <button
                                  type="submit"
                                  className="botones2"
                                >
                                  Entrar
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

            <td width="35%">&nbsp;</td>
          </tr>

          <tr>
            <td colSpan="2" className="lila" height="100"></td>
            <td className="moradoclaro"></td>
            <td className="lila"></td>
          </tr>

          <tr>
            <td colSpan="2"></td>
            <td className="verdeagua"></td>
            <td className="verde"></td>
          </tr>

          <tr>
            <td colSpan="2"></td>
            <td className="naranja"></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
