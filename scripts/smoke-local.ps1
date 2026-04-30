param(
    [int]$BackendPort = 8080,
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"

$backendBaseUrl = "http://localhost:$BackendPort"
$frontendBaseUrl = "http://localhost:$FrontendPort"

Write-Host "Checking backend health at $backendBaseUrl/actuator/health/readiness"
$readiness = Invoke-RestMethod -Uri "$backendBaseUrl/actuator/health/readiness" -Method Get
Write-Host "Backend readiness: $($readiness.status)"

Write-Host "Checking API health at $backendBaseUrl/api/v1/health"
$apiHealth = Invoke-RestMethod -Uri "$backendBaseUrl/api/v1/health" -Method Get
Write-Host "API health response received."

Write-Host "Checking frontend at $frontendBaseUrl"
$frontendResponse = Invoke-WebRequest -Uri $frontendBaseUrl -Method Get -UseBasicParsing
Write-Host "Frontend status: $($frontendResponse.StatusCode)"

Write-Host "Local smoke validation complete."
