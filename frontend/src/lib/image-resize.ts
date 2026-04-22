const MAX_WIDTH = 1024;
const MAX_HEIGHT = 768;
const JPEG_QUALITY = 0.85;

export async function resizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
  const targetWidth = Math.round(img.width * scale);
  const targetHeight = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

export async function resizeImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => resizeImageFile(f).catch(() => f)));
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
