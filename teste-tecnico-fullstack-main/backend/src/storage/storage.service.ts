import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname, join, resolve, isAbsolute } from 'path';
import * as fs from 'fs';

export interface StorageResult {
  storedName: string;
  filePath: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    const keyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secret = config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = config.get<string>('AWS_REGION', 'us-east-1');
    this.bucket = config.get<string>('AWS_S3_BUCKET', '');

    if (keyId && secret && this.bucket) {
      this.s3 = new S3Client({
        region: this.region,
        credentials: { accessKeyId: keyId, secretAccessKey: secret },
      });
    }
  }

  get isS3Enabled(): boolean {
    return this.s3 !== null;
  }

  async save(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'texts' | 'images',
  ): Promise<StorageResult> {
    const storedName = `${uuidv4()}${extname(originalName).toLowerCase()}`;
    if (this.s3) {
      return this.saveToS3(buffer, storedName, mimeType, folder);
    }
    return this.saveToDisk(buffer, storedName, folder);
  }

  private async saveToS3(
    buffer: Buffer,
    storedName: string,
    mimeType: string,
    folder: string,
  ): Promise<StorageResult> {
    const key = `${folder}/${storedName}`;
    await this.s3!.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    const filePath = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return { storedName, filePath };
  }

  private saveToDisk(buffer: Buffer, storedName: string, folder: string): StorageResult {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const dir = join(uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, storedName), buffer);
    return {
      storedName,
      filePath: join('uploads', folder, storedName),
    };
  }

  async remove(filePath: string): Promise<void> {
    if (this.s3 && filePath.startsWith('https://')) {
      try {
        const url = new URL(filePath);
        const key = url.pathname.slice(1);
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } catch {
        // ignore S3 delete errors — object may not exist
      }
    } else {
      try {
        const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
        fs.unlinkSync(absolutePath);
      } catch {
        // ignore local delete errors — file may not exist
      }
    }
  }
}
