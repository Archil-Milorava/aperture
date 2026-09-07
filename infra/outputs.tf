output "ecr_repository_url" {
  description = "Docker push/pull URL for the app image"
  value       = aws_ecr_repository.app.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket that holds post images"
  value       = aws_s3_bucket.uploads.bucket
}
