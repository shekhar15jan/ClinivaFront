# Cliniva Frontend - FTP Deploy Configuration
# Copy this file to deploy-config.ps1 and fill in your Hostinger FTP details
# deploy-config.ps1 is in .gitignore and should never be committed

# Hostinger FTP server (e.g., ftp.yourdomain.com or your IP)
$FtpServer = "ftp://www.cliniva.com"

# FTP username (provided by Hostinger)
$FtpUsername = "your-ftp-username"

# FTP password
$FtpPassword = "your-ftp-password"

# Remote path on Hostinger where the Angular app files go
# Usually public_html or www for the main domain, or a subfolder
$FtpRemotePath = "/public_html"
