# Solo Wit Luv — Artist Site (Angular + Terraform)

Domain: `solowitluv.com` • Hosted Zone ID: `Z02121601AA9I81LBQEQX`

## Quick start
```bash
npm ci
ng build --configuration=production
```

Deploy: see `infra/` and use Terraform to provision all AWS resources. The S3 bucket name is now unique per deployment and can be found in Terraform outputs (e.g., `terraform output bucket_name`).

## Content
Edit JSON in `src/content/*`. Add images under `src/assets/*`.

## Deploy (manual)
```bash
# Get your unique S3 bucket name from Terraform output
BUCKET=$(terraform -chdir=infra output -raw bucket_name)

aws s3 sync ./dist/artist-site/browser s3://$BUCKET/ --exclude "index.html" --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./dist/artist-site/browser/index.html s3://$BUCKET/index.html --cache-control "no-cache"

# Get your CloudFront distribution domain or ID from Terraform output
# (e.g., terraform -chdir=infra output cloudfront_domain)
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/index.html" "/" "/releases" "/shows" "/gallery" "/bio"
```