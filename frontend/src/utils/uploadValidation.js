const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

export const isSupportedUpload = (file) => {
  if (!file || file.size <= 0 || file.size > MAX_UPLOAD_SIZE) return false;
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return allowedMimeTypes[extension] === file.type;
};

export { MAX_UPLOAD_SIZE };
