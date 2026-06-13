# ─── LMS Application IAM User ─────────────────────────────
resource "aws_iam_user" "lms_app" {
  name = "${var.project_name}-app-user-${var.environment}"
  tags = { Purpose = "LMS application S3 access" }
}

resource "aws_iam_access_key" "lms_app" {
  user = aws_iam_user.lms_app.name
}

# ─── S3 Access Policy ─────────────────────────────────────
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-s3-access-${var.environment}"
  description = "Allows LMS backend to access S3 media bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectAcl",
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.s3_bucket_arn
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "lms_s3" {
  user       = aws_iam_user.lms_app.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# ─── ECR Repositories ─────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "lms-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "lms-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection     = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action        = { type = "expire" }
    }]
  })
}

# ─── Variables ────────────────────────────────────────────
variable "project_name"     { type = string }
variable "environment"      { type = string }
variable "s3_bucket_arn"    { type = string }
variable "eks_node_role_arn" { type = string }

# ─── Outputs ──────────────────────────────────────────────
output "app_access_key_id"     { value = aws_iam_access_key.lms_app.id }
output "app_secret_access_key" {
  value     = aws_iam_access_key.lms_app.secret
  sensitive = true
}
output "ecr_backend_url"       { value = aws_ecr_repository.backend.repository_url }
output "ecr_frontend_url"      { value = aws_ecr_repository.frontend.repository_url }
