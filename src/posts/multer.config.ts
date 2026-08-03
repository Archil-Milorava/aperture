import { randomUUID } from 'crypto';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage, type Options } from 'multer';

/**
 * Multer options for image uploads. For the MVP we store files on local disk
 * (./uploads) with a random name; in Phase B this is where S3 storage swaps in.
 */
export const multerImageOptions: Options = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
      // random name + original extension, e.g. 7f3a...e2.png
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new BadRequestException('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};
