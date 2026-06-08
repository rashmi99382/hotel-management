variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short name used in AWS resource names."
  type        = string
  default     = "smart-hotel"
}

variable "lightsail_blueprint_id" {
  description = "Lightsail OS image."
  type        = string
  default     = "ubuntu_22_04"
}

variable "lightsail_bundle_id" {
  description = "Lightsail bundle. medium_3_0 is the 4 GB RAM / 80 GB SSD class in current Lightsail bundles."
  type        = string
  default     = "medium_3_0"
}

variable "app_repo_url" {
  description = "Git repository URL to clone onto Lightsail. Leave empty to upload manually."
  type        = string
  default     = ""
}

variable "app_repo_branch" {
  description = "Git branch to deploy when app_repo_url is set."
  type        = string
  default     = "main"
}

variable "uploads_bucket_name" {
  description = "Optional exact S3 bucket name. Leave empty to generate one."
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "Origins allowed to upload/read media through S3 CORS."
  type        = list(string)
  default     = ["*"]
}

variable "vpc_id" {
  description = "VPC ID for the RDS security group."
  type        = string
}

variable "db_subnet_ids" {
  description = "At least two subnet IDs for the RDS subnet group."
  type        = list(string)
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to connect to PostgreSQL for admin maintenance."
  type        = list(string)
  default     = []
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "smart_hotel"
}

variable "db_username" {
  description = "PostgreSQL admin username."
  type        = string
  default     = "smart_hotel"
}

variable "db_password" {
  description = "PostgreSQL admin password."
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS PostgreSQL instance size."
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB."
  type        = number
  default     = 20
}

variable "domain_name" {
  description = "Optional domain name to point to Lightsail, for example app.example.com."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Optional Route 53 hosted zone ID for domain_name."
  type        = string
  default     = ""
}

variable "razorpay_key_id" {
  description = "Razorpay public key ID."
  type        = string
  default     = "rzp_test_Sz2Mt6BNwHKPsr"
}

variable "razorpay_key_secret" {
  description = "Razorpay key secret. Keep this only on the server."
  type        = string
  sensitive   = true
  default     = ""
}
