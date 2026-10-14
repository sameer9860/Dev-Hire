/**
 * Downloads a remote file directly to the user's local storage (Downloads folder)
 * without opening a new browser tab or exposing the raw storage URL in the address bar.
 *
 * 1. Fetches the file bytes via CORS into a local Blob.
 * 2. Simulates an invisible click on a Blob anchor with the `download` attribute.
 * 3. Falls back to a signed URL with `&download=` param (which instructs Supabase
 *    Storage to respond with `Content-Disposition: attachment; filename=...`).
 */
export async function downloadFile(url: string, defaultFilename: string = 'resume.pdf'): Promise<void> {
  if (!url) return;

  const rawName = defaultFilename.trim().replace(/[/\\?%*:|"<>]/g, '_');
  const filename = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (err) {
    // Fallback: append download param so Supabase sets Content-Disposition: attachment
    const separator = url.includes('?') ? '&' : '?';
    const downloadUrl = `${url}${separator}download=${encodeURIComponent(filename)}`;

    const fallbackAnchor = document.createElement('a');
    fallbackAnchor.style.display = 'none';
    fallbackAnchor.href = downloadUrl;
    fallbackAnchor.download = filename;
    document.body.appendChild(fallbackAnchor);
    fallbackAnchor.click();

    setTimeout(() => {
      if (fallbackAnchor.parentNode) {
        fallbackAnchor.parentNode.removeChild(fallbackAnchor);
      }
    }, 1000);
  }
}
