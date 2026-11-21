// Deezer serves every size of an artist photo at the same path, up to the size of the original
// (1200 or 1900 px square). Larger requests get the original.
export const deezerPhotoUrl = (url: string, size: number) =>
  url.replace(/\/\d+x\d+-/, `/${size}x${size}-`);
