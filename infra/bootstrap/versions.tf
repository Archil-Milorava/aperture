# This module's own state stays LOCAL, deliberately — it creates the bucket
# that every OTHER Terraform state (infra/) will live in. You can't store that
# state inside the bucket before the bucket exists (chicken-and-egg), so this
# one small piece is the one exception to "state lives in S3." Run it once per
# AWS account; you should basically never touch it again.
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-north-1"
}

variable "project" {
  description = "Name prefix applied to all resources"
  type        = string
  default     = "aperture"
}

data "aws_caller_identity" "current" {}
