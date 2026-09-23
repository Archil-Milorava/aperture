# The bucket that will hold every OTHER Terraform state file (infra/, and
# later any CI-driven applies). Deliberately NOT force_destroy, and protected
# by prevent_destroy — losing this bucket loses the record of everything
# Terraform has ever created for real.
resource "aws_s3_bucket" "tfstate" {
  bucket = "${var.project}-tfstate-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

# Versioning means a bad `apply` (or a corrupted state write) doesn't destroy
# your only copy of the state — S3 keeps prior versions of the file.
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# No DynamoDB lock table: Terraform >= 1.10 can lock natively inside the S3
# backend itself (backend "s3" { use_lockfile = true }, see infra/versions.tf)
# — one fewer AWS service to run and explain, doing the exact same job.
