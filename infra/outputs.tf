# Values printed after `terraform apply`. This is the URL we push the image to.
output "ecr_repository_url" {
  description = "Docker push/pull URL for the app image"
  value       = aws_ecr_repository.app.repository_url
}
