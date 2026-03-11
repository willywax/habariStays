# Habari Stays - GCP Deployment Guide

## Prerequisites

1. **Google Cloud SDK** installed and configured
2. **Docker** installed locally (for testing)
3. **GCP Project** with billing enabled
4. **MongoDB Atlas** cluster (or Cloud MongoDB)

## Quick Start

### 1. Initial GCP Setup

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Configure Secrets

Create secrets in GCP Secret Manager:

```bash
# MongoDB connection string
echo -n "mongodb+srv://user:pass@cluster.mongodb.net" | \
  gcloud secrets create mongo-url --data-file=-

# Database name
echo -n "habari_stays" | \
  gcloud secrets create db-name --data-file=-

# JWT Secret
echo -n "your-super-secret-jwt-key-change-this" | \
  gcloud secrets create jwt-secret --data-file=-

# Optional: Cloudinary, Beem SMS, etc.
echo -n "your-cloudinary-cloud-name" | \
  gcloud secrets create cloudinary-cloud-name --data-file=-
```

### 3. Deploy Using Cloud Build (Recommended)

```bash
# Deploy both services
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_MONGO_URL=$(gcloud secrets versions access latest --secret=mongo-url),_DB_NAME=$(gcloud secrets versions access latest --secret=db-name),_SECRET_KEY=$(gcloud secrets versions access latest --secret=jwt-secret)
```

### 4. Manual Deployment (Alternative)

#### Deploy Backend

```bash
cd backend

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/habari-stays-api

# Deploy to Cloud Run
gcloud run deploy habari-stays-api \
  --image gcr.io/YOUR_PROJECT_ID/habari-stays-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "MONGO_URL=your-mongo-url,DB_NAME=habari_stays,SECRET_KEY=your-secret"
```

#### Deploy Frontend

```bash
cd frontend

# Build with API URL
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/habari-stays-web \
  --build-arg REACT_APP_API_URL=https://habari-stays-api-xxxxx.run.app

# Deploy to Cloud Run
gcloud run deploy habari-stays-web \
  --image gcr.io/YOUR_PROJECT_ID/habari-stays-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi
```

## Environment Variables

### Backend Required Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `SECRET_KEY` | JWT signing secret |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `diupey6vs` |
| `CLOUDINARY_UPLOAD_PRESET` | Upload preset | `habari_stays_upload` |
| `BEEM_API_KEY` | Beem SMS API key | - |
| `BEEM_SECRET_KEY` | Beem SMS secret | - |
| `BEEM_SENDER_ID` | SMS sender ID | `HABARISTAYS` |

### Frontend Build Arguments

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL (e.g., `https://habari-stays-api-xxx.run.app`) |

## Custom Domain Setup

```bash
# Map custom domain to frontend
gcloud run domain-mappings create \
  --service habari-stays-web \
  --domain www.habaristays.com \
  --region us-central1

# Map API subdomain to backend
gcloud run domain-mappings create \
  --service habari-stays-api \
  --domain api.habaristays.com \
  --region us-central1
```

## CI/CD with Cloud Build Triggers

```bash
# Connect your GitHub repository
gcloud builds triggers create github \
  --repo-name=habariStays \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_MONGO_URL=$$MONGO_URL,_DB_NAME=$$DB_NAME,_SECRET_KEY=$$SECRET_KEY
```

## Monitoring & Logs

```bash
# View backend logs
gcloud run logs read habari-stays-api --region us-central1

# View frontend logs
gcloud run logs read habari-stays-web --region us-central1

# Stream live logs
gcloud run logs tail habari-stays-api --region us-central1
```

## Cost Optimization

Cloud Run charges only for actual usage:

- **Backend**: 512Mi RAM, scales to zero when idle
- **Frontend**: 256Mi RAM, serves static files efficiently
- **Estimated cost**: $5-20/month for moderate traffic

## Troubleshooting

### Build Fails
- Check Docker build locally: `docker build -t test ./backend`
- Verify all dependencies are in requirements.txt

### Connection Issues
- Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0) or use VPC connector
- Check environment variables are set correctly

### CORS Errors
- Update CORS settings in `server.py` to include your Cloud Run URLs

## Local Testing

```bash
# Test backend Docker build
cd backend
docker build -t habari-backend .
docker run -p 8080:8080 --env-file .env habari-backend

# Test frontend Docker build
cd frontend
docker build -t habari-frontend --build-arg REACT_APP_API_URL=http://localhost:8080 .
docker run -p 3000:8080 habari-frontend
```
