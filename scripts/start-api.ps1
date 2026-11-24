$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repositoryRoot

$envFile = Join-Path $repositoryRoot '.env'
if (Test-Path $envFile) {
    $keyLine = Get-Content $envFile |
        Where-Object { $_ -match '^\s*GEMINI_API_KEY\s*=' } |
        Select-Object -Last 1
    if ($keyLine) {
        $key = ($keyLine -replace '^\s*GEMINI_API_KEY\s*=\s*', '').Trim()
        if ($key.Length -ge 2 -and
            (($key.StartsWith('"') -and $key.EndsWith('"')) -or
             ($key.StartsWith("'") -and $key.EndsWith("'")))) {
            $key = $key.Substring(1, $key.Length - 2)
        }
        if ($key) {
            $env:GEMINI_API_KEY = $key
        }
    }
}

if (-not $env:GEMINI_API_KEY) {
    $frontendEnvFile = Join-Path $repositoryRoot 'frontend\.env'
    $frontendKeyLine = if (Test-Path $frontendEnvFile) {
        Get-Content $frontendEnvFile |
            Where-Object { $_ -match '^\s*GEMINI_API_KEY\s*=' } |
            Select-Object -First 1
    }
    if ($frontendKeyLine) {
        Write-Warning 'GEMINI_API_KEY is in frontend\.env. Move only that entry to the root .env; keep VITE_* settings in frontend\.env.'
    } else {
        Write-Warning 'GEMINI_API_KEY is not set; manual routing works, but AI features will be unavailable.'
    }
}

& mingw32-make -f travel.make api
if ($LASTEXITCODE -ne 0) {
    throw "API build failed with exit code $LASTEXITCODE."
}

& .\travel_api.exe
