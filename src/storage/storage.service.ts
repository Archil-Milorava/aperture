import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Wraps all S3 access. In dev it talks to LocalStack; in prod it would talk to
 * real AWS S3 — the code is identical, only the config (endpoint/creds) differs.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly s3ForUrls: S3Client;
  private readonly bucket: string;
  private readonly urlExpiresIn: number;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('AWS_S3_ENDPOINT');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET')!;

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      // For LocalStack we hit a custom endpoint and must use "path-style" URLs
      // (endpoint/bucket/key) instead of the default virtual-hosted style
      // (bucket.endpoint/key), which LocalStack doesn't serve. Real AWS sets no
      // endpoint, so this block is skipped there.
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    const publicEndpoint = this.config.get<string>('AWS_S3_PUBLIC_ENDPOINT');
    this.urlExpiresIn = this.config.get<number>('AWS_S3_URL_EXPIRES', 900);

    // A SECOND client used only to SIGN read URLs. Signing is offline (no network
    // call), so we sign against the endpoint the BROWSER will use (localhost),
    // even though uploads go through the internal endpoint (localstack). On real
    // AWS both endpoints are unset, so this is just a normal S3 client.
    this.s3ForUrls = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      ...(publicEndpoint
        ? { endpoint: publicEndpoint, forcePathStyle: true }
        : {}),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  /**
   * LocalStack's S3 is in-memory and starts empty on every restart, so ensure
   * our bucket exists when the app boots. In real AWS the bucket is created once
   * (usually via Terraform), so HeadBucket succeeds and this is a no-op.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.log(`Bucket "${this.bucket}" not found — creating it`);
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  /**
   * Upload an image to S3 and return its object KEY (e.g. "posts/ab12….jpg").
   * We store the key, not a full URL — the browser-facing URL is generated when
   * a post is read (next slice).
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = `posts/${randomUUID()}${extname(file.originalname)}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      return key;
    } catch (err) {
      this.logger.error('Failed to upload image to S3', err as Error);
      throw new InternalServerErrorException('Image upload failed');
    }
  }

  /**
   * Generate a temporary, signed URL to VIEW an object. Anyone holding the link
   * can open it until it expires (default 15 min) — the bucket stays private.
   */
  async getSignedImageUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3ForUrls, command, {
      expiresIn: this.urlExpiresIn,
    });
  }
}
