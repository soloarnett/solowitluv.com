output "bucket_name" { value = aws_s3_bucket.site.bucket }
output "cloudfront_domain" { value = aws_cloudfront_distribution.site.domain_name }