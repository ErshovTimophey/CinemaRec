#!/bin/bash
echo "Configuring AWS credentials..."
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

echo "Attempting to create S3 bucket..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://cinemarec-images && {
  echo "S3 bucket cinemarec-images created successfully."
  exit 0
}
echo "Bucket creation failed, checking if it already exists..."
aws --endpoint-url=http://localhost:4566 s3 ls s3://cinemarec-images && {
  echo "Bucket already exists, proceeding."
  exit 0
}
echo "Failed to create or verify S3 bucket cinemarec-images."
exit 1