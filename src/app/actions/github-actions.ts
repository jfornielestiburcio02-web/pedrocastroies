'use server';

/**
 * @fileOverview Acción de servidor para gestionar la subida de imágenes al repositorio de GitHub.
 * Utiliza el token proporcionado directamente para asegurar la conectividad inmediata.
 */

export async function uploadImageToGithub(base64Image: string, fileName: string) {
  // Token proporcionado por el usuario (Inyección directa para evitar fallos de entorno)
  const token = process.env.PEDROCASTRO_IMAGENES_GENERA;
  const owner = "jfornielestiburcio02-web"; 
  const repo = "pedrocastroies";

  if (!token) {
    throw new Error('Error interno: No se ha podido validar la identidad con GitHub.');
  }

  const path = `public/imagenes/cec/fotoAlumnoServlet/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Limpiar el prefijo data:image/... si existe
  const content = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // 1. Obtener el SHA si el archivo ya existe para poder actualizarlo
  let sha = undefined;
  try {
    const checkRes = await fetch(url, {
      headers: { 
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      },
      cache: 'no-store'
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
    }
  } catch (e) {
    console.log("Iniciando creación de nuevo archivo.");
  }

  // 2. Realizar el PUT a la API de GitHub
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: `Actualización de foto de perfil: ${fileName} [Sincro Directa]`,
      content: content,
      sha: sha
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(`Error de GitHub (${res.status}): ${errorBody.message || 'Fallo en la comunicación'}`);
  }

  return `/imagenes/cec/fotoAlumnoServlet/${fileName}`;
}

