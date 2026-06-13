terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  # Remote state in S3 (configure before first apply)
  backend "s3" {
    bucket         = "lms-terraform-state-316749727294"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "lms-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "DevOPS-LMS"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── Modules ──────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  project_name   = var.project_name
  environment    = var.environment
  vpc_cidr       = var.vpc_cidr
  azs            = var.availability_zones
}

module "eks" {
  source = "./modules/eks"

  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  cluster_version = var.eks_cluster_version
  node_instance_type = var.node_instance_type
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
  bucket_name  = var.s3_bucket_name
}

module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
  s3_bucket_arn = module.s3.bucket_arn
  eks_node_role_arn = module.eks.node_role_arn
}
