resource "aws_apigatewayv2_api" "release_api" {
  provider      = aws.use1
  name          = "${var.project}-release-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_api" "shows_api" {
  provider      = aws.use1
  name          = "${var.project}-shows-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  provider               = aws.use1
  api_id                 = aws_apigatewayv2_api.release_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.release_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "shows_lambda_integration" {
  provider               = aws.use1
  api_id                 = aws_apigatewayv2_api.shows_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_shows.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_releases" {
  provider  = aws.use1
  api_id    = aws_apigatewayv2_api.release_api.id
  route_key = "GET /releases"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_shows" {
  provider  = aws.use1
  api_id    = aws_apigatewayv2_api.shows_api.id
  route_key = "GET /shows"
  target    = "integrations/${aws_apigatewayv2_integration.shows_lambda_integration.id}"
}

resource "aws_lambda_permission" "apigw_invoke" {
  provider      = aws.use1
  statement_id  = "AllowAPIGwInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.release_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.release_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "shows_apigw_invoke" {
  provider      = aws.use1
  statement_id  = "AllowShowsAPIGwInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_shows.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.shows_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "prod" {
  provider    = aws.use1
  api_id      = aws_apigatewayv2_api.release_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_stage" "shows_prod" {
  provider    = aws.use1
  api_id      = aws_apigatewayv2_api.shows_api.id
  name        = "$default"
  auto_deploy = true
}

output "release_api_base_url" {
  value = aws_apigatewayv2_api.release_api.api_endpoint
}

output "shows_api_base_url" {
  value = aws_apigatewayv2_api.shows_api.api_endpoint
}
