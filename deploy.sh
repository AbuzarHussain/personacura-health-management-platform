#!/bin/bash

# GCP Deployment Script for Personacura
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

PROJECT_ID=${1:-"YOUR_PROJECT_ID"}
REGION=${2:-"us-central1"}

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Check if project ID is set
if [ "$PROJECT_ID" == "YOUR_PROJECT_ID" ]; then
    echo "Error: Please provide your GCP Project ID"
    echo "Usage: ./deploy.sh PROJECT_ID [REGION]"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Get Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe personacura-db \
  --format="value(connectionName)" \
  --project=$PROJECT_ID 2>/dev/null)

if [ -z "$CONNECTION_NAME" ]; then
    echo "  Warning: Cloud SQL instance 'personacura-db' not found"
    echo "   Please create it first or update the instance name in this script"
    echo "   Continuing without Cloud SQL connection..."
    CONNECTION_NAME=""
else
    echo "  Found Cloud SQL connection: $CONNECTION_NAME"
fi

# Build backend
echo ""
echo "  Building backend Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/personacura-backend

if [ $? -ne 0 ]; then
    echo "  Backend build failed"
    exit 1
fi

# Deploy backend
echo ""
echo "  Deploying backend to Cloud Run..."
if [ -n "$CONNECTION_NAME" ]; then
    gcloud run deploy personacura-backend \
      --image gcr.io/$PROJECT_ID/personacura-backend \
      --platform managed \
      --region=$REGION \
      --allow-unauthenticated \
      --add-cloudsql-instances=$CONNECTION_NAME \
      --set-env-vars="DB_USER=db-user-name,DB_PASS=db-password,DB_NAME=db-name,DB_SOCKET_PATH=/cloudsql/$CONNECTION_NAME" \
      --memory=512Mi \
      --cpu=1 \
      --timeout=300 \
      --max-instances=10
else
    gcloud run deploy personacura-backend \
      --image gcr.io/$PROJECT_ID/personacura-backend \
      --platform managed \
      --region=$REGION \
      --allow-unauthenticated \
      --set-env-vars="DB_HOST=db-host,DB_PORT=db-port,DB_USER=db-user-name,DB_PASS=db-password,DB_NAME=db-name" \
      --memory=512Mi \
      --cpu=1 \
      --timeout=300 \
      --max-instances=10
fi

if [ $? -ne 0 ]; then
    echo "  Backend deployment failed"
    exit 1
fi

# Get backend URL
BACKEND_URL=$(gcloud run services describe personacura-backend \
  --platform managed \
  --region=$REGION \
  --format="value(status.url)")

echo "  Backend deployed at: $BACKEND_URL"

# Build frontend
echo ""
echo "  Building frontend Docker image..."
gcloud builds submit \
  --config=cloudbuild-frontend.yaml \
  --substitutions=_REACT_APP_API_URL=$BACKEND_URL

if [ $? -ne 0 ]; then
    echo "  Frontend build failed"
    exit 1
fi

# Deploy frontend
echo ""
echo "  Deploying frontend to Cloud Run..."
gcloud run deploy personacura-frontend \
  --image gcr.io/$PROJECT_ID/personacura-frontend \
  --platform managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --port=80

if [ $? -ne 0 ]; then
    echo "  Frontend deployment failed"
    exit 1
fi

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe personacura-frontend \
  --platform managed \
  --region=$REGION \
  --format="value(status.url)")

echo ""
echo "  Deployment complete!"
echo ""
echo "  Frontend URL: $FRONTEND_URL"
echo "  Backend URL: $BACKEND_URL"
echo ""


