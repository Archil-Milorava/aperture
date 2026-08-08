import { BadRequestException } from '@nestjs/common';
import { memoryStorage, type Options } from 'multer';

/**
 * Multer options for image uploads. We keep the file in MEMORY (not on disk)
 * so we can hand its buffer straight to S3 — see StorageService.uploadImage.
 */
export const multerImageOptions: Options = {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new BadRequestException('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};
