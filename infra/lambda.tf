resource "aws_lambda_function" "release_api" {
  function_name    = "${var.project}-release-api"
  role             = aws_iam_role.release_api_role.arn
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = "./lambda_release_api.zip" # provide this zip locally during apply
  source_code_hash = filebase64sha256("./lambda_release_api.zip")

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.releases.name
      CLOUDFRONT_DOMAIN = var.cloudfront_domain
      IMAGE_PROTOCOL    = "https"
      ALLOWED_STATUS    = "released"
    }
  }
}
