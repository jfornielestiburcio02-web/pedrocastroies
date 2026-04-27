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

    setClaveCifrada(cifrar(clave));
    setClave("");
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
          background-color: #9A6289;
        }

        .blanco {
          background-color: #FFFFFF;
        }

        .lila {
          background-color: #BE9BB4;
        }

        .moradoclaro {
          background-color: #DBC6D4;
        }

        .verdeagua {
          background-color: #B7DDC8;
        }

        .verde {
          background-color: #B3D76B;
        }

        .naranja {
          background-color: #EAB863;
        }

        .botones {
          background-color: #FFFFFF;
          padding-top: 2px;
          padding-right: 2px;
          padding-bottom: 2px;
          padding-left: 2px;
          border: 1px #6B4560 solid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: normal;
          color: #000000;
          width: 100px;
          text-decoration: none;
        }

        .botones:hover {
          background-color: #DDCAD8;
          padding-top: 2px;
          padding-right: 2px;
          padding-bottom: 2px;
          padding-left: 2px;
          border: 1px #6B4560 solid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: normal;
          color: #5A3A51;
          text-decoration: none;
        }

        input {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #573957;
          text-decoration: none;
          background-color: #DBC6D4;
          border: #FFFFFF;
          border-style: solid;
          border-top-width: 1px;
          border-right-width: 1px;
          border-bottom-width: 1px;
          border-left-width: 1px;
        }

        .input_check {
          background-color: transparent;
          border: none;
        }

        .usuario {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          font-weight: bold;
          color: #FFFFFF;
          text-decoration: none;
        }

        .usuarioMostrar {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          font-weight: bold;
          color: #B3D76B;
          text-decoration: none;
        }

        .mensaje {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          font-weight: bold;
          color: #E8FF48;
          text-decoration: none;
        }

        .botones2 {
          background-color: #F0AA94;
          padding-top: 2px;
          padding-right: 2px;
          padding-bottom: 2px;
          padding-left: 2px;
          text-align: center;
          border: 1px #E77551 solid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #903214;
          width: 100px;
          text-decoration: none;
          cursor: pointer;
        }

        .botones2:hover {
          background-color: #B3D76B;
          padding-top: 2px;
          padding-right: 2px;
          padding-bottom: 2px;
          padding-left: 2px;
          border: 1px solid;
          text-align: center;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #000000;
          text-decoration: none;
          border-color: #799F2B #669933 #669933;
        }

        .titulo {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: bold;
          color: #FFFFFF;
          text-decoration: none;
          background-color: #9A6289;
          width: 100%;
          padding-left: 10px;
        }

        .txtblanco {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          text-align: justify;
          font-weight: normal;
          color: #FFFFFF;
          text-decoration: none;
          padding-top: 4px;
          padding-right: 4px;
          padding-bottom: 4px;
          padding-left: 10px;
        }

        .txtpositivo {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: bold;
          color: #FFFFFF;
          text-decoration: none;
          padding-top: 4px;
          padding-right: 4px;
          padding-bottom: 4px;
          padding-left: 10px;
        }

        .txtidentificacion {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: bold;
          color: #DBC6D4;
          text-decoration: none;
          padding-top: 4px;
          padding-right: 4px;
          padding-bottom: 4px;
          padding-left: 10px;
        }

        .txtmensajeerror {
          color: #FF9900;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: normal;
          padding: 4px 4px 4px 10px;
          text-align: justify;
          text-decoration: none;
        }

        .lista {
          background-image: url('/secretaria_on.gif');
          background-repeat: no-repeat;
          background-position: 5px 5px;
        }

        .txtcabecera {
          font-family: impact, Arial, Helvetica, sans-serif;
          background-color: #8D5A7E;
          color: #FFFFFF;
          font-size: 18pt;
        }

        .blanco a {
          color: #B3D76B;
          font-family: tahoma;
          font-size: 14pt;
          text-decoration: none;
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
                      <img src="/logo_rayuela.gif" width="230" height="157" alt="" />
                    </td>
                    <td align="right" valign="bottom">&nbsp;</td>
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
                          El usuario, la contraseña o ambos son incorrectos, puede pedir nuevas contraseñas pulsando en la opción 'Solicitar nuevas contraseñas' o poniéndose en contacto con el C.A.U.
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
                                  type="text"
                                  size="20"
                                  value={usuario}
                                  onChange={(e) => setUsuario(e.target.value)}
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
                                  size="20"
                                  value={clave}
                                  onChange={(e) => setClave(e.target.value)}
                                />
                                <input type="hidden" value={claveCifrada} readOnly />
                              </td>
                            </tr>

                            <tr>
                              <td>&nbsp;</td>
                            </tr>

                            <tr align="center">
                              <td>
                                <button type="submit" className="botones2">
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
        </tbody>
      </table>
    </>
  );
}
