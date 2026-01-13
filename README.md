# Solo Wit Luv — Artist Site (Angular + Terraform)

Domain: `solowitluv.com` • Hosted Zone ID: `Z02121601AA9I81LBQEQX`

## Quick start
```bash
npm ci
ng build --configuration=production
```

Deploy: see `infra/` and use Terraform to provision all AWS resources. The S3 bucket name is unique per deployment and can be found in the AWS Console or Terraform outputs.

## Content
Edit JSON in `src/content/*`. Add images under `src/assets/*`.

## Deploy (manual)
```bash

# Automatically get your S3 bucket name (requires AWS CLI and jq):
BUCKET=$(aws s3api list-buckets --query 'Buckets[?starts_with(Name,`solowitluv-solowitluv-com`)].Name' --output text)

aws s3 sync ./dist/artist-site/browser s3://$BUCKET/ --exclude "index.html" --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./dist/artist-site/browser/index.html s3://$BUCKET/index.html --cache-control "no-cache"

# Replace <DIST_ID> with your CloudFront distribution ID
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/index.html" "/" "/releases" "/shows" "/gallery" "/bio"
```