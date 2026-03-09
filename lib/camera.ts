/**
 * Camera service - use native Camera plugin on mobile, file input on web.
 */

import { getCamera } from "./capacitor";

export type PhotoResult = {
  base64: string;
  format: "jpeg" | "png" | "webp";
};

export async function takePhoto(): Promise<PhotoResult | null> {
  const mod = await getCamera();
  if (!mod?.Camera) return null;
  const { Camera, CameraResultType, CameraSource } = mod;

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      allowEditing: true,
    });

    if (!image.base64String) return null;
    const format = (image.format ?? "jpeg") as "jpeg" | "png" | "webp";
    return { base64: image.base64String, format };
  } catch {
    return null;
  }
}

export async function pickFromGallery(): Promise<PhotoResult | null> {
  const mod = await getCamera();
  if (!mod?.Camera) return null;
  const { Camera, CameraResultType, CameraSource } = mod;

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    if (!image.base64String) return null;
    const format = (image.format ?? "jpeg") as "jpeg" | "png" | "webp";
    return { base64: image.base64String, format };
  } catch {
    return null;
  }
}
