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

aws s3 sync ./dist/artist-site/browser s3://$BUCKET/ --exclude "index.html" --exclude "ngsw.json" --exclude "ngsw-worker.js" --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./dist/artist-site/browser/index.html s3://$BUCKET/index.html --cache-control "no-cache"
aws s3 cp ./dist/artist-site/browser/ngsw.json s3://$BUCKET/ngsw.json --cache-control "no-cache"
aws s3 cp ./dist/artist-site/browser/ngsw-worker.js s3://$BUCKET/ngsw-worker.js --cache-control "no-cache"


# Automatically get your CloudFront distribution ID (requires AWS CLI and jq):
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'solowitluv.com')]].Id" --output text)

aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/index.html" "/ngsw.json" "/ngsw-worker.js" "/" "/releases" "/shows" "/gallery" "/bio"
```