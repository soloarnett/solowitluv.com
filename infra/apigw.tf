resource "aws_apigatewayv2_api" "release_api" {
  name          = "${var.project}-release-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.release_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.release_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_releases" {
  api_id    = aws_apigatewayv2_api.release_api.id
  route_key = "GET /releases"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGwInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.release_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.release_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.release_api.id
  name        = "$default"
  auto_deploy = true
}

output "release_api_base_url" {
  value = aws_apigatewayv2_api.release_api.api_endpoint
}
