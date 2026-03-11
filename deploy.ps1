# PowerShell Deployment Script for Habari Stays on GCP
# Usage: .\deploy.ps1 -Target [backend|frontend|all]

param(
    [Parameter()]
    [ValidateSet("backend", "frontend", "all")]
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

# Configuration
$Region = "us-central1"
$BackendService = "habari-stays-api"
$FrontendService = "habari-stays-web"

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Get Project ID
function Get-ProjectId {
    $projectId = gcloud config get-value project 2>$null
    if (-not $projectId) {
        Write-Err "No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
    return $projectId
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    try {
        $null = Get-Command gcloud -ErrorAction Stop
    } catch {
        Write-Err "gcloud CLI not found. Install from: https://cloud.google.com/sdk/install"
        exit 1
    }
    
    $script:ProjectId = Get-ProjectId
    Write-Info "Using project: $script:ProjectId"
}

# Enable required APIs
function Enable-GcpApis {
    Write-Info "Enabling required GCP APIs..."
    gcloud services enable cloudbuild.googleapis.com --quiet
    gcloud services enable run.googleapis.com --quiet
    gcloud services enable containerregistry.googleapis.com --quiet
}

# Deploy Backend
function Deploy-Backend {
    Write-Info "Deploying backend..."
    Push-Location backend
    
    try {
        # Build and push
        gcloud builds submit --tag "gcr.io/$script:ProjectId/$BackendService" --quiet
        
        # Deploy
        gcloud run deploy $BackendService `
            --image "gcr.io/$script:ProjectId/$BackendService" `
            --platform managed `
            --region $Region `
            --allow-unauthenticated `
            --memory 512Mi `
            --cpu 1 `
            --min-instances 0 `
            --max-instances 10 `
            --quiet
        
        $backendUrl = gcloud run services describe $BackendService --region $Region --format "value(status.url)"
        Write-Info "Backend deployed at: $backendUrl"
        return $backendUrl
    }
    finally {
        Pop-Location
    }
}

# Deploy Frontend
function Deploy-Frontend {
    Write-Info "Deploying frontend..."
    
    # Get backend URL
    try {
        $backendUrl = gcloud run services describe $BackendService --region $Region --format "value(status.url)" 2>$null
    } catch {
        Write-Warn "Backend not deployed yet. Using placeholder URL."
        $backendUrl = "https://$BackendService-xxxxx.run.app"
    }
    
    Push-Location frontend
    
    try {
        # Build with API URL
        gcloud builds submit `
            --tag "gcr.io/$script:ProjectId/$FrontendService" `
            --build-arg "REACT_APP_API_URL=$backendUrl" `
            --quiet
        
        # Deploy
        gcloud run deploy $FrontendService `
            --image "gcr.io/$script:ProjectId/$FrontendService" `
            --platform managed `
            --region $Region `
            --allow-unauthenticated `
            --memory 256Mi `
            --cpu 1 `
            --min-instances 0 `
            --max-instances 5 `
            --quiet
        
        $frontendUrl = gcloud run services describe $FrontendService --region $Region --format "value(status.url)"
        Write-Info "Frontend deployed at: $frontendUrl"
    }
    finally {
        Pop-Location
    }
}

# Main
Test-Prerequisites
Enable-GcpApis

switch ($Target) {
    "backend" { Deploy-Backend }
    "frontend" { Deploy-Frontend }
    "all" {
        Deploy-Backend
        Deploy-Frontend
    }
}

Write-Info "Deployment complete!"
