# Solo Wit Luv — Artist Site (Angular + Terraform)

Domain: `solowitluv.com` • Hosted Zone ID: `Z02121601AA9I81LBQEQX`

## Quick start
```bash
npm ci
ng build --configuration=production
```
Deploy: see `infra/` and the S3/CloudFront commands in the README footer.

## Content
Edit JSON in `src/content/*`. Add images under `src/assets/*`.

## Deploy (manual)
```bash
aws s3 sync ./dist/artist-site/browser s3://solowitluv-com/ --exclude "index.html" --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./dist/artist-site/browser/index.html s3://solowitluv-com/index.html --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/index.html" "/" "/releases" "/shows" "/gallery" "/bio"
```