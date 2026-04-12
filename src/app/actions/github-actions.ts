'use server';

/**
 * @fileOverview Acción de servidor para gestionar la subida de imágenes al repositorio de GitHub.
 */

/**
 * Sube una imagen en base64 al repositorio de GitHub del IES Pedro Castro.
 */
export async function uploadImageToGithub(base64Image: string, fileName: string) {
  // Obtención de variables desde el entorno del servidor
  const token = process.env.PEDROCASTRO_IMAGENES_GENERA;
  const owner = process.env.GITHUB_OWNER; 
  const repo = process.env.GITHUB_REPO;

  // Registro de diagnóstico (solo visible en logs del servidor)
  console.log(`Intentando subida a GitHub: Repo=${owner}/${repo}, Archivo=${fileName}`);

  if (!token || token.trim() === "") {
    throw new Error('ERROR DE AUTENTICACIÓN: El servidor no tiene acceso al Token. Por favor, asegúrese de haber creado el secreto en Google Cloud Secret Manager y vinculado en App Hosting.');
  }

  if (!owner || !repo) {
    throw new Error('ERROR DE CONFIGURACIÓN: No se han definido GITHUB_OWNER o GITHUB_REPO en las variables de entorno.');
  }

  const path = `public/imagenes/cec/fotoAlumnoServlet/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Limpiar el prefijo data:image/... si existe
  const content = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // 1. Obtener el SHA si el archivo ya existe (para actualizar)
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
      message: `Actualización de foto de perfil: ${fileName} [Sincro Rayuela]`,
      content: content,
      sha: sha
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(`Error de API GitHub (${res.status}): ${errorBody.message || 'Fallo en la comunicación'}`);
  }

  return `/imagenes/cec/fotoAlumnoServlet/${fileName}`;
}
