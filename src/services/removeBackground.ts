import { File, Paths } from 'expo-file-system';

const BGNINJA_URL = 'https://bgninja.com/api/remove';

// Function: infer a safe upload name and MIME type from the local image URI.
function getUploadMetadata(imageUri: string) {
  const extension = imageUri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return { type: 'image/png', name: 'idali-photo.png' };
  if (extension === 'webp') return { type: 'image/webp', name: 'idali-photo.webp' };
  if (extension === 'heic' || extension === 'heif') return { type: 'image/heic', name: 'idali-photo.heic' };
  return { type: 'image/jpeg', name: 'idali-photo.jpg' };
}

export async function removeBackground(imageUri: string) {
  const upload = getUploadMetadata(imageUri);
  const sourceFile = new File(imageUri);
  let response: Response | undefined;
  // Loop: retry one time when the service rate-limits the request.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const form = new FormData();
    form.append('file', sourceFile, upload.name);
    form.append('src', 'idali-mobile-app');
    response = await fetch(BGNINJA_URL, { method: 'POST', body: form });
    if (response.status !== 429 || attempt === 1) break;
    await new Promise(resolve => setTimeout(resolve, 750));
  }

  // Conditional: stop early if fetch never produced a response.
  if (!response) throw new Error('BGNinja did not return a response.');

  if (!response.ok) {
    let message = `BGNinja request failed (${response.status}).`;
    try {
      const error = await response.json() as { error?: string };
      if (error.error) message = error.error;
    } catch {
      // Keep the status-based message when the service does not return JSON.
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image/png')) throw new Error('BGNinja returned an invalid image response.');

  const output = new File(Paths.cache, `idali-background-removed-${Date.now()}.png`);
  output.write(new Uint8Array(await response.arrayBuffer()));
  return output.uri;
}
