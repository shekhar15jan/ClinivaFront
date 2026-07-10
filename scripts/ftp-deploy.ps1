param(
  [Parameter(Mandatory=$false)]
  [string]$ConfigPath = "$PSScriptRoot\deploy-config.ps1"
)

$ErrorActionPreference = "Stop"

if (Test-Path $ConfigPath) {
  . $ConfigPath
} else {
  Write-Host "No deploy-config.ps1 found at $ConfigPath" -ForegroundColor Yellow
  Write-Host "Creating deploy-config.example.ps1 - copy it to deploy-config.ps1 and fill in your FTP details" -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$distDir = "dist\cliniva-front\browser"
if (-not (Test-Path $distDir)) {
  $distDir = "dist\cliniva-front"
  if (-not (Test-Path $distDir)) {
    $distDir = "dist"
    if (-not (Test-Path $distDir)) {
      Write-Host "ERROR: Build output not found. Run scripts\build-prod.ps1 first." -ForegroundColor Red
      exit 1
    }
  }
}

Write-Host "=== FTP Deploy to Hostinger ===" -ForegroundColor Cyan
Write-Host "Server: $($FtpServer)" -ForegroundColor Gray
Write-Host "Target: $($FtpRemotePath)" -ForegroundColor Gray
Write-Host "Source: $distDir" -ForegroundColor Gray
Write-Host ""

$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($FtpUsername, $FtpPassword)

$files = Get-ChildItem -Recurse $distDir -File
$total = $files.Count
$i = 0

foreach ($file in $files) {
  $i++
  $relative = $file.FullName.Substring((Get-Item $distDir).FullName.Length + 1)
  $remoteUrl = "$FtpServer$FtpRemotePath/$($relative -replace '\\', '/')"
  $percent = [math]::Round($i / $total * 100, 0)
  Write-Progress -Activity "Uploading to Hostinger" -Status "$relative" -PercentComplete $percent -CurrentOperation "$i / $total"

  try {
    $webclient.UploadFile($remoteUrl, $file.FullName) | Out-Null
    Write-Host "[$percent%] Uploaded: $relative" -ForegroundColor Green
  } catch {
    Write-Host "[FAIL] $relative - $_" -ForegroundColor Red
  }
}

$webclient.Dispose()
Write-Host ""
Write-Host "Deploy complete!" -ForegroundColor Green
