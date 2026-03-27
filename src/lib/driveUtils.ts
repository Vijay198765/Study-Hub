/**
 * Converts a standard Google Drive sharing link to a direct download link.
 * Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * To: https://drive.google.com/uc?export=download&id=FILE_ID
 */
export function getDirectDriveLink(url: string): string {
  if (!url) return "";

  // Check if it's already a direct link
  if (url.includes("drive.google.com/uc?")) return url;

  // Extract file ID from standard sharing link
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }

  // Handle other formats if needed
  return url;
}
