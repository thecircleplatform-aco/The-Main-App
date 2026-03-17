# Push .env.local secrets to Fly.io
# Run from project root: .\scripts\push-env-to-fly.ps1
# Requires: fly auth login already done

$envFile = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Run from project root (circle folder)."
  exit 1
}

$lines = Get-Content $envFile -Raw
$lines = $lines -replace "`r`n", "`n" -split "`n"

foreach ($line in $lines) {
  $line = $line.Trim()
  if (-not $line -or $line.StartsWith("#")) { continue }
  # Skip Vercel-only vars (not needed on Fly)
  if ($line -match "^VERCEL_") { continue }

  $idx = $line.IndexOf("=")
  if ($idx -le 0) { continue }

  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()

  # Strip surrounding quotes so we pass one quoted arg to fly
  if ($value.Length -ge 2) {
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
  }

  # Fly rejects empty secret values; skip (e.g. GIT_SHA is often empty, injected at build)
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skipping $key (empty value)"
    continue
  }

  Write-Host "Setting secret: $key"
  $pair = "${key}=${value}"
  & fly secrets set "$pair"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to set $key"
  }
}

Write-Host "Done. List secrets: fly secrets list"
