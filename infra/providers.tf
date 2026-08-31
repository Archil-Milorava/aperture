# Configures the AWS provider. The region comes from a variable, and default_tags
# stamps EVERY resource we create — so they're easy to find and to track costs by.
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}
