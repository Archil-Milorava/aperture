# Pins the Terraform version and the AWS provider version so everyone — and CI —
# uses the same tooling. Reproducible infrastructure.
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Generates a random database password for us.
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    # Fetches GitHub's live OIDC signing certificate (infra/oidc.tf) — so the
    # trust setup always uses GitHub's current thumbprint, never a hardcoded
    # one that could go stale.
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Remote state: shared between your laptop and CI (a fresh, throwaway VM
  # with no access to a local .tfstate file). Bucket/table created once by
  # infra/bootstrap/ — see that module for why it's a separate, local-state
  # exception to this.
  # NOTE: backend blocks can't use variables/interpolation — Terraform needs
  # this literally, before it has resolved anything else. Values match
  # `terraform -chdir=infra/bootstrap output`.
  backend "s3" {
    bucket       = "aperture-tfstate-861023264252"
    key          = "infra/terraform.tfstate"
    region       = "eu-north-1"
    use_lockfile = true # native S3 locking (Terraform >= 1.10) — no DynamoDB needed
    encrypt      = true
  }
}
