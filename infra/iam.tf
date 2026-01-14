data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "release_api_role" {
  name               = "solowitluv-release-api-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "release_api_policy" {
  statement {
    actions = ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem"]
    resources = [
      aws_dynamodb_table.releases.arn,
      aws_dynamodb_table.shows.arn
    ]
  }
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "release_api_policy" {
  name   = "solowitluv-release-api-policy"
  policy = data.aws_iam_policy_document.release_api_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_policy" {
  role       = aws_iam_role.release_api_role.name
  policy_arn = aws_iam_policy.release_api_policy.arn
}
