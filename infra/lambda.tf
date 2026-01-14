
resource "aws_lambda_function" "release_api" {
  provider         = aws.use1
  function_name    = "solowitluv-release-api"
  role             = aws_iam_role.release_api_role.arn
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = "${path.module}/lambda/get_releases/lambda_release_api.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/get_releases/lambda_release_api.zip")

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.releases.name
      CLOUDFRONT_DOMAIN = var.cloudfront_domain
      IMAGE_PROTOCOL    = "https"
      ALLOWED_STATUS    = "released"
    }
  }
}

resource "aws_lambda_function" "get_shows" {
  provider         = aws.use1
  function_name    = "solowitluv-get-shows"
  role             = aws_iam_role.release_api_role.arn # reuse role or create a new one if needed
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = "${path.module}/lambda/get_shows/get_shows.zip" # ensure this zip exists
  source_code_hash = filebase64sha256("${path.module}/lambda/get_shows/get_shows.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.shows.name
    }
  }
}
