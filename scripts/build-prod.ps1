$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "=== Cliniva Frontend Production Build ===" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
  if (-not $?) { throw "npm install failed" }
}

Write-Host "Building Angular app for production..." -ForegroundColor Yellow
npx ng build --configuration=production
if (-not $?) { throw "Angular build failed" }

$dist = "dist\cliniva-front\browser"
if (Test-Path $dist) {
  $size = (Get-ChildItem -Recurse $dist | Measure-Object -Property Length -Sum).Sum / 1MB
  Write-Host "Build complete! Output: $dist ([math]::Round($size, 2) MB)" -ForegroundColor Green
} elseif (Test-Path "dist\cliniva-front") {
  $size = (Get-ChildItem -Recurse "dist\cliniva-front" | Measure-Object -Property Length -Sum).Sum / 1MB
  Write-Host "Build complete! Output: dist\cliniva-front ([math]::Round($size, 2) MB)" -ForegroundColor Green
} else {
  $size = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
  Write-Host "Build complete! Output: dist\ ([math]::Round($size, 2) MB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next step: Run scripts\ftp-deploy.ps1 to upload to Hostinger" -ForegroundColor Cyan
