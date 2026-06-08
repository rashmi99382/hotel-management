resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name_prefix = "${var.project_name}-${random_id.suffix.hex}"
  bucket_name = var.uploads_bucket_name != "" ? var.uploads_bucket_name : "${local.name_prefix}-uploads"
  app_url     = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lightsail_static_ip.app.ip_address}"
}

resource "aws_s3_bucket" "uploads" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_iam_user" "uploads" {
  name = "${local.name_prefix}-s3-uploader"
}

resource "aws_iam_user_policy" "uploads" {
  name = "${local.name_prefix}-s3-policy"
  user = aws_iam_user.uploads.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.uploads.arn
      }
    ]
  })
}

resource "aws_iam_access_key" "uploads" {
  user = aws_iam_user.uploads.name
}

resource "aws_cognito_user_pool" "main" {
  name                     = "${local.name_prefix}-users"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.name_prefix}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
  supported_identity_providers  = ["COGNITO"]
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = var.db_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds"
  description = "PostgreSQL access for Smart Hotel"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "rds_from_lightsail" {
  type              = "ingress"
  security_group_id = aws_security_group.rds.id
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["${aws_lightsail_static_ip.app.ip_address}/32"]
}

resource "aws_security_group_rule" "rds_admin" {
  for_each          = toset(var.admin_cidr_blocks)
  type              = "ingress"
  security_group_id = aws_security_group.rds.id
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_db_instance" "postgres" {
  identifier             = "${local.name_prefix}-postgres"
  allocated_storage      = var.rds_allocated_storage
  instance_class         = var.rds_instance_class
  engine                 = "postgres"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true
  storage_encrypted      = true
  backup_retention_period = 7
  skip_final_snapshot    = true
}

resource "aws_lightsail_instance" "app" {
  name              = "${local.name_prefix}-app"
  availability_zone = "${var.aws_region}a"
  blueprint_id      = var.lightsail_blueprint_id
  bundle_id         = var.lightsail_bundle_id

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    app_repo_url        = var.app_repo_url
    app_repo_branch     = var.app_repo_branch
    aws_region          = var.aws_region
    s3_upload_bucket    = aws_s3_bucket.uploads.bucket
    database_host       = aws_db_instance.postgres.address
    database_name       = var.db_name
    database_user       = var.db_username
    cognito_pool_id     = aws_cognito_user_pool.main.id
    cognito_client_id   = aws_cognito_user_pool_client.web.id
    razorpay_key_id     = var.razorpay_key_id
    public_base_url     = local.app_url
  })
}

resource "aws_lightsail_static_ip" "app" {
  name = "${local.name_prefix}-static-ip"
}

resource "aws_lightsail_static_ip_attachment" "app" {
  static_ip_name = aws_lightsail_static_ip.app.name
  instance_name  = aws_lightsail_instance.app.name
}

resource "aws_lightsail_instance_public_ports" "app" {
  instance_name = aws_lightsail_instance.app.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
  }

  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
  }

  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
  }
}

resource "aws_route53_record" "app" {
  count   = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_lightsail_static_ip.app.ip_address]
}
