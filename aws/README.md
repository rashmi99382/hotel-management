# Smart Hotel AWS Deployment

This folder prepares the current Smart Hotel web for AWS:

- AWS Lightsail instance: 4 GB RAM / 80 GB SSD class
- Amazon S3: image and video uploads
- Amazon RDS PostgreSQL: database
- Amazon Cognito: login and token verification
- Amazon Route 53: optional domain record

The current browser UI can still run locally. The new `server/` folder is the AWS API and static file server that lets the app move from localStorage/demo data toward real AWS storage.

## 1. Prepare AWS Inputs

Copy the example Terraform variables:

```bash
cp aws/terraform/terraform.tfvars.example aws/terraform/terraform.tfvars
```

Edit `aws/terraform/terraform.tfvars`:

- `vpc_id`: your AWS VPC ID
- `db_subnet_ids`: at least two subnet IDs for RDS
- `db_password`: strong database password
- `domain_name` and `hosted_zone_id`: only if you already have a Route 53 hosted zone
- `app_repo_url`: your GitHub repo, for example `https://github.com/rashmi99382/hotel-management.git`

## 2. Create AWS Resources

```bash
cd aws/terraform
terraform init
terraform apply
```

After apply, Terraform prints:

- Lightsail public IP
- S3 bucket
- RDS endpoint
- Cognito user pool and client ID
- S3 access key output names

Get the sensitive S3 secret with:

```bash
terraform output -raw s3_secret_access_key
```

## 3. Configure Lightsail App

SSH into Lightsail and update the server environment:

```bash
sudo nano /opt/smart-hotel/.env
```

Fill these values:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
DATABASE_URL=postgres://smart_hotel:YOUR_DB_PASSWORD@YOUR_RDS_ENDPOINT:5432/smart_hotel
RAZORPAY_KEY_SECRET=...
```

Then restart:

```bash
cd /opt/smart-hotel
npm install --omit=dev
psql "$DATABASE_URL" -f server/schema.sql
sudo systemctl restart smart-hotel
sudo systemctl status smart-hotel --no-pager
```

## 4. Domain

If `domain_name` and `hosted_zone_id` are set, Terraform creates a Route 53 `A` record to the Lightsail static IP.

For HTTPS, install Certbot on Lightsail after the domain points correctly:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 5. Current Prototype Boundary

The current UI still has local prototype data in browser storage. The server now provides:

- `/health`
- `/api/uploads/presign`
- `/api/tenants/:tenantId/state/:moduleName`
- `/api/public/qr/:tenantId`

Next, each module can be wired one by one to these API endpoints so the same data works across browsers and devices.
