# Lets GitHub Actions authenticate to AWS with short-lived, auto-rotated
# credentials instead of a static access key sitting in a GitHub secret.
# Each workflow run gets a fresh OIDC token from GitHub, trades it for
# temporary AWS credentials via sts:AssumeRoleWithWebIdentity, and that
# token expires with the job. Nothing long-lived to leak or rotate.

# GitHub's own OIDC signing certificate, fetched live — the thumbprint below
# is always current, never a hardcoded value that could go stale if GitHub
# rotates it.
data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only a workflow run triggered by a push to main can assume this role —
    # not a PR, not another branch, not a fork. Tightest scope that still
    # matches "deploy on push to main."
    #
    # NOTE: this is "repo:OWNER@ownerId/REPO@repoId:ref:..." rather than the
    # plainer "repo:OWNER/REPO:ref:...". GitHub adds the numeric owner/repo
    # IDs when either has ever been renamed, so a stale name can't silently
    # match a different, later owner of it. Confirmed via CloudTrail (the
    # actual sub claim a real run presented), not guessed.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:Archil-Milorava@10231072/aperture@1318346174:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

# Scoped to the AWS services this Terraform config actually manages — NOT
# AdministratorAccess (which is what your local terraform-admin user has).
# CI gets a smaller blast radius than your own laptop: if a workflow or a
# dependency were ever compromised, it can only touch what's listed here.
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "terraform-deploy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "TerraformState"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource = ["arn:aws:s3:::aperture-tfstate-861023264252", "arn:aws:s3:::aperture-tfstate-861023264252/*"]
      },
      {
        Sid    = "ManagedServices"
        Effect = "Allow"
        Action = [
          "ec2:*", "elasticloadbalancing:*", "ecs:*", "ecr:*",
          "rds:*", "ssm:*", "logs:*", "s3:*",
        ]
        Resource = "*"
      },
      {
        # IAM is separate and tighter: only the roles/policies/provider THIS
        # project creates — not IAM as a whole.
        Sid    = "IamForThisProject"
        Effect = "Allow"
        Action = [
          "iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:UpdateRole",
          "iam:TagRole", "iam:UntagRole", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
          "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy",
          "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:PassRole",
          "iam:GetOpenIDConnectProvider", "iam:CreateOpenIDConnectProvider",
          "iam:DeleteOpenIDConnectProvider", "iam:UpdateOpenIDConnectProviderThumbprint",
          "iam:TagOpenIDConnectProvider", "iam:UntagOpenIDConnectProvider",
        ]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn,
          aws_iam_role.github_actions_deploy.arn,
          aws_iam_openid_connect_provider.github_actions.arn,
        ]
      },
    ]
  })
}
