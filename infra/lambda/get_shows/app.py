# app.py for get_shows Lambda
import json
import os
import boto3
from boto3.dynamodb.conditions import Attr

ddb = boto3.resource("dynamodb")

def lambda_handler(event, context):
    table_name = os.environ.get("TABLE_NAME", "solowitluv-shows")
    table = ddb.Table(table_name)

    # Only fetch upcoming shows (date >= today)
    from datetime import datetime
    today = datetime.utcnow().strftime("%Y-%m-%d")
    scan_kwargs = {
        'FilterExpression': Attr('date').gte(today)
    }
    items = []
    start_key = None
    while True:
        if start_key:
            scan_kwargs["ExclusiveStartKey"] = start_key
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))
        start_key = resp.get("LastEvaluatedKey")
        if not start_key:
            break

    # Sort by date ascending
    items.sort(key=lambda x: x.get("date", ""))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(items)
    }
