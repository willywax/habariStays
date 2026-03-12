#!/bin/bash
# Habari Stays - GCP Deployment Script
# Usage: ./deploy.sh [backend|frontend|all]

set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
BACKEND_SERVICE="habari-stays-api"
FRONTEND_SERVICE="habari-stays-web"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        echo_error "gcloud CLI not found. Install from: https://cloud.google.com/sdk/install"
        exit 1
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        echo_error "No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    echo_info "Using project: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    echo_info "Enabling required GCP APIs..."
    gcloud services enable cloudbuild.googleapis.com --quiet
    gcloud services enable run.googleapis.com --quiet
    gcloud services enable containerregistry.googleapis.com --quiet
}

# Deploy Backend
deploy_backend() {
    echo_info "Deploying backend..."
    cd backend
    
    # Build and push
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE --quiet
    
    # Deploy
    gcloud run deploy $BACKEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --quiet
    
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
    echo_info "Backend deployed at: $BACKEND_URL"
    
    cd ..
}

# Deploy Frontend
deploy_frontend() {
    echo_info "Deploying frontend..."
    
    # Use custom API domain
    BACKEND_URL="https://api.habaristays.com"
    
    cd frontend
    
    # Build with API URL
    gcloud builds submit \
        --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
        --build-arg REACT_APP_BACKEND_URL=$BACKEND_URL \
        --quiet
    
    # Deploy
    gcloud run deploy $FRONTEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 256Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 5 \
        --quiet
    
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')
    echo_info "Frontend deployed at: $FRONTEND_URL"
    
    cd ..
}

# Main
main() {
    check_prerequisites
    enable_apis
    
    case "${1:-all}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            deploy_frontend
            ;;
        *)
            echo "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac
    
    echo_info "Deployment complete!"
}

main "$@"
