import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  async uploadFile(file: Express.Multer.File) {
    return {
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
