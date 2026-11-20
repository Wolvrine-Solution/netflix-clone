terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "netflix-clone"
}

module "database" {
  source = "./modules/database"
  project = var.project
}

module "redis" {
  source = "./modules/redis"
  project = var.project
}

module "storage" {
  source = "./modules/storage"
  project = var.project
}

module "cdn" {
  source  = "./modules/cdn"
  project = var.project
  bucket  = module.storage.bucket_name
}

module "dns" {
  source = "./modules/dns"
  project = var.project
  cdn_domain = module.cdn.domain_name
}

output "database_url" {
  value     = module.database.connection_string
  sensitive = true
}

output "redis_url" {
  value     = module.redis.connection_string
  sensitive = true
}

output "cdn_domain" {
  value = module.cdn.domain_name
}
