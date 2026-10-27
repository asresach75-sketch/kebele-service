const fs = require('fs/promises');
const { isValidFileSignature } = require('../utils/uploadValidation');

const collectFiles = (files) => {
  if (Array.isArray(files)) return files;
  return Object.values(files || {}).flat();
};

const removeFiles = async (files) => {
  await Promise.all(files.map(async (file) => {
    if (!file.path) return;
    try {
      await fs.unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }));
};

const validateUploadContent = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, async (uploadError) => {
    if (uploadError) return next(uploadError);

    const files = collectFiles(req.files);
    try {
      for (const file of files) {
        const content = await fs.readFile(file.path);
        if (!isValidFileSignature(content, file.mimetype)) {
          await removeFiles(files);
          return res.status(400).json({
            success: false,
            message: 'The uploaded file content does not match its JPG, PNG, or PDF type.',
          });
        }
      }
    } catch (error) {
      try {
        await removeFiles(files);
      } catch (cleanupError) {
        return next(cleanupError);
      }
      return next(error);
    }

    return next();
  });
};

module.exports = validateUploadContent;
