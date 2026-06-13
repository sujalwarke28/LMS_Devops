# ─── S3 Bucket ────────────────────────────────────────────
resource "aws_s3_bucket" "lms_media" {
  bucket = "${var.bucket_name}-${var.environment}"

  tags = {
    Name        = "${var.project_name}-media-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.lms_media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.lms_media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.lms_media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.lms_media.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.lms_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["https://*.yourdomain.com", "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ─── Variables ────────────────────────────────────────────
variable "project_name" { type = string }
variable "environment"  { type = string }
variable "bucket_name"  { type = string }

# ─── Outputs ──────────────────────────────────────────────
output "bucket_name" { value = aws_s3_bucket.lms_media.id }
output "bucket_arn"  { value = aws_s3_bucket.lms_media.arn }
