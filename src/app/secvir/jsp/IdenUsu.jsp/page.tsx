
"use client";

import { useState, useEffect } from "react";

export default function Page() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("16829");
  const [claveCifrada, setClaveCifrada] = useState("16829");

  useEffect(() => {
    window.name = "NV_1777295280677";
  }, []);

  function cifrar(texto) {
    return btoa(texto);
  }

  function comprobarclave(e) {
    e.preventDefault();

    if (usuario === "") {
      alert("El campo 'Usuario' es obligatorio");
    } else if (clave === "") {
      alert("El campo 'Clave' es obligatorio");
    } else {
      const cifrada = cifrar(clave);
      setClaveCifrada(cifrada);
      setClave("");
      alert("Formulario enviado");
    }
  }

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #ffffff;
        }

        .morado { background-color: #9A6289; }
        .blanco { background-color: #FFFFFF; }
        .lila { background-color: #BE9BB4; }
        .moradoclaro { background-color: #DBC6D4; }
        .verdeagua { background-color: #B7DDC8; }
        .verde { background-color: #B3D76B; }
        .naranja { background-color: #EAB863; }

        .botones {
          background-color: #FFFFFF;
          padding: 2px;
          border: 1px #6B4560 solid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          color: #000000;
          width: 100px;
          text-decoration: none;
        }

        .botones:hover {
          background-color: #DDCAD8;
          color: #5A3A51;
        }

        input {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #573957;
          background-color: #DBC6D4;
          border: 1px solid #FFFFFF;
        }

        .usuario {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          font-weight: bold;
          color: #FFFFFF;
        }

        .botones2 {
          background-color: #F0AA94;
          padding: 2px;
          text-align: center;
          border: 1px #E77551 solid;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8pt;
          font-weight: bold;
          color: #903214;
          width: 100px;
          text-decoration: none;
          cursor: pointer;
          display: inline-block;
        }

        .botones2:hover {
          background-color: #B3D76B;
          color: #000000;
        }

        table {
          border-collapse: collapse;
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
                      <form onSubmit={comprobarclave}>
                        <table align="center">
                          <tbody>
                            <tr align="center">
                              <td className="usuario">
                                Usuario <br />
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
                                  value={claveCifrada}
                                  type="hidden"
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

            <td width="35%">
              <table width="100%" height="151">
                <tbody>
                  <tr align="center">
                    <td>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan="2" className="lila" height="100" width="60%">
              <table width="100%">
                <tbody>
                  <tr align="center">
                    <td width="20%">&nbsp;</td>
                    <td width="20%">&nbsp;</td>
                    <td width="20%">
                      <img
                        src="/images/menu_GESTION_CENTROS.gif"
                        width="103"
                        height="69"
                        alt=""
                      />
                    </td>
                    <td width="20%">&nbsp;</td>
                    <td width="20%">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td className="moradoclaro" align="right">
              <img src="/images/txt_ray.gif" width="167" height="36" alt="" />
            </td>

            <td className="lila" align="left">
              <img src="/images/txt_uela.gif" width="166" height="36" alt="" />
            </td>
          </tr>

          <tr>
            <td colSpan="2">&nbsp;</td>

            <td className="verdeagua" align="right">
              <img
                src="/images/tit_plataforma.gif"
                width="167"
                height="32"
                alt=""
              />
            </td>

            <td className="verde" align="right">
              <img
                src="/images/tit_educativa.gif"
                width="166"
                height="32"
                alt=""
              />
            </td>
          </tr>

          <tr>
            <td colSpan="2" rowSpan="2">&nbsp;</td>

            <td className="naranja">&nbsp;</td>

            <td align="right">
              <img
                src="/images/tit_extrem.gif"
                width="166"
                height="17"
                alt=""
              />
            </td>
          </tr>

          <tr>
            <td className="naranja">&nbsp;</td>

            <td align="center">
              <img
                src="/images/logo_junta.gif"
                width="166"
                height="59"
                alt=""
              />
              <br />
              <img
                src="/images/FEDER-UE.jpg"
                width="165"
                height="44"
                alt=""
              />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
