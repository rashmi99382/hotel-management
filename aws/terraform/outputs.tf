output "lightsail_static_ip" {
  value = aws_lightsail_static_ip.app.ip_address
}

output "app_url" {
  value = local.app_url
}

output "s3_upload_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "s3_access_key_id" {
  value = aws_iam_access_key.uploads.id
}

output "s3_secret_access_key" {
  value     = aws_iam_access_key.uploads.secret
  sensitive = true
}
