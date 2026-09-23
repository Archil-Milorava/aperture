output "bucket" {
  description = "Paste into infra/versions.tf's backend \"s3\" block as `bucket`"
  value       = aws_s3_bucket.tfstate.id
}
