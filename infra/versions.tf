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
  }
}
