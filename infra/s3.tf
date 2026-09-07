data "aws_caller_identity" "current" {}


resource "aws_s3_bucket" "uploads" {

  bucket = "${var.project}-uploads-${data.aws_caller_identity.current.account_id}"

  force_destroy = true
}
