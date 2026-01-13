resource "aws_lambda_function" "release_api" {
  provider         = aws.use1
  function_name    = "solowitluv-release-api"
  role             = aws_iam_role.release_api_role.arn
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = "${path.module}/lambda/lambda_release_api.zip" # provide this zip in the lambda folder
  source_code_hash = filebase64sha256("${path.module}/lambda/lambda_release_api.zip")

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.releases.name
      CLOUDFRONT_DOMAIN = var.cloudfront_domain
      IMAGE_PROTOCOL    = "https"
      ALLOWED_STATUS    = "released"
    }
  }
}
