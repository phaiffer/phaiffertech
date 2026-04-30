param(
    [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"

function Import-EnvFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "Local env file '$Path' was not found. Using frontend defaults where available."
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

if (-not $env:NEXT_PUBLIC_API_URL) {
    $env:NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1"
}

if (-not $env:FRONTEND_PORT) {
    $env:FRONTEND_PORT = "3000"
}

Write-Host "Starting frontend on port '$env:FRONTEND_PORT'."
Write-Host "API URL: $env:NEXT_PUBLIC_API_URL"

Push-Location -LiteralPath "apps/frontend"
try {
    & npm run dev -- --hostname 127.0.0.1 --port $env:FRONTEND_PORT
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
