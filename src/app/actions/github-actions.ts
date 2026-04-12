'use server';

/**
 * @fileOverview Acción de servidor para gestionar la subida de imágenes al repositorio de GitHub.
 */

/**
 * Sube una imagen en base64 al repositorio de GitHub del IES Pedro Castro.
 * @param base64Image La imagen en formato data URI o base64 puro.
 * @param fileName El nombre del archivo (ej: jsmith.jpg).
 * @returns La ruta relativa donde se ha guardado el archivo en el repo.
 */
export async function uploadImageToGithub(base64Image: string, fileName: string) {
  const token = process.env.PEDROCASTRO_IMAGENES_GENERA;
  const owner = process.env.GITHUB_OWNER || 'tu-usuario-github'; // Configurar en env
  const repo = process.env.GITHUB_REPO || 'tu-repositorio';     // Configurar en env

  if (!token) {
    throw new Error('El secreto PEDROCASTRO_IMAGENES_GENERA no está configurado en el servidor.');
  }

  if (!owner || owner === 'tu-usuario-github') {
    throw new Error('La variable GITHUB_OWNER no está configurada.');
  }

  const path = `public/imagenes/cec/fotoAlumnoServlet/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Limpiar el prefijo data:image/... si existe
  const content = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // 1. Comprobar si el archivo existe para obtener su SHA (necesario para actualizar/sobrescribir)
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
    console.log("Archivo nuevo, no se requiere SHA");
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
      message: `Actualización de foto de perfil: ${fileName} [Rayuela App]`,
      content: content,
      sha: sha // Si existe, se sobrescribe. Si no, se crea.
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error desconocido al subir a GitHub');
  }

  // Retornamos la ruta pública que servirá Next.js
  return `/imagenes/cec/fotoAlumnoServlet/${fileName}`;
}
