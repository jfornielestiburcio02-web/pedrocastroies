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
  // Intentamos obtener el token desde la variable configurada
  const token = process.env.PEDROCASTRO_IMAGENES_GENERA;
  
  // Variables de entorno para el repositorio (Deben configurarse en el panel de App Hosting)
  const owner = process.env.GITHUB_OWNER; 
  const repo = process.env.GITHUB_REPO;

  if (!token) {
    throw new Error('ERROR CRÍTICO: El secreto "PEDROCASTRO_IMAGENES_GENERA" no se ha mapeado correctamente en el servidor. Verifique apphosting.yaml.');
  }

  if (!owner || !repo) {
    throw new Error(`ERROR DE CONFIGURACIÓN: Faltan las variables de entorno GITHUB_OWNER o GITHUB_REPO en el servidor.`);
  }

  const path = `public/imagenes/cec/fotoAlumnoServlet/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Limpiar el prefijo data:image/... si existe para obtener solo el base64 puro
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
    console.log("Archivo nuevo o error de red inicial, se intentará creación limpia.");
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
      message: `Actualización de foto de perfil: ${fileName} [Rayuela App Sincro]`,
      content: content,
      sha: sha // Si existe el SHA, GitHub entiende que es una actualización. Si no, es creación.
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(`GitHub API Error: ${errorBody.message || 'Fallo al subir la imagen'}`);
  }

  // Retornamos la ruta pública que servirá Next.js desde /public
  return `/imagenes/cec/fotoAlumnoServlet/${fileName}`;
}
