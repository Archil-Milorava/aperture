# ECR = Elastic Container Registry: AWS's private Docker registry. We push the
# app image here, and later ECS pulls it from here to run it.
resource "aws_ecr_repository" "app" {
  name = "${var.project}-app"

  # Lets `terraform destroy` remove the repo even if it still holds images —
  # convenient while learning. In production you'd be more careful.
  force_delete = true

  # Free basic vulnerability scan on every pushed image.
  image_scanning_configuration {
    scan_on_push = true
  }
}
