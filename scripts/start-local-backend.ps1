param(
    [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"

function Import-EnvFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "Local env file '$Path' was not found. Using application defaults where available."
        return
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            return
        }

        $separatorIndex = $line.IndexOf("=")
        if ($separatorIndex -lt 1) {
            return
        }

        $name = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        Set-Item -Path "Env:$name" -Value $value
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $repoRoot

Import-EnvFile -Path $EnvFile

if (-not $env:SPRING_PROFILES_ACTIVE) {
    $env:SPRING_PROFILES_ACTIVE = "dev"
}

if (-not $env:SPRING_DATASOURCE_URL) {
    $env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/platform_db"
}

if (-not $env:SPRING_DATASOURCE_USERNAME) {
    $env:SPRING_DATASOURCE_USERNAME = "platform_user"
}

if (-not $env:SPRING_DATASOURCE_PASSWORD) {
    $env:SPRING_DATASOURCE_PASSWORD = "platform_pass"
}

if (-not $env:SERVER_PORT -and $env:BACKEND_PORT) {
    $env:SERVER_PORT = $env:BACKEND_PORT
}

$serverPort = $env:SERVER_PORT
if (-not $serverPort) {
    $serverPort = "8080"
}

Write-Host "Starting backend with profile '$env:SPRING_PROFILES_ACTIVE' on port '$serverPort'."
Write-Host "Database: $env:SPRING_DATASOURCE_URL"

Push-Location -LiteralPath "apps/backend"
try {
    & mvn spring-boot:run
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
