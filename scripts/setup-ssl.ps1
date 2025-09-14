#!/usr/bin/env pwsh
# 🔐 SSL Setup Script for MainWebSite
# Hỗ trợ cả Tailscale Funnel và Self-signed certificates

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("tailscale", "self-signed", "both")]
    [string]$Method,
    
    [string]$Domain = "desktop-v88j9e0.tail2b3d3b.ts.net",
    [int]$Port = 3000,
    [string]$SslDir = "ssl"
)

Write-Host "🔐 MainWebSite SSL Setup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Tạo thư mục SSL nếu chưa có
if (!(Test-Path $SslDir)) {
    New-Item -ItemType Directory -Path $SslDir -Force | Out-Null
    Write-Host "✅ Created SSL directory: $SslDir" -ForegroundColor Green
}

function Setup-TailscaleFunnel {
    Write-Host "🚀 Setting up Tailscale Funnel..." -ForegroundColor Yellow
    
    # Kiểm tra Tailscale đã cài chưa
    try {
        $tailscaleVersion = tailscale version
        Write-Host "✅ Tailscale found: $($tailscaleVersion.Split("`n")[0])" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tailscale not found! Please install Tailscale first." -ForegroundColor Red
        Write-Host "Download from: https://tailscale.com/download/windows" -ForegroundColor Yellow
        return $false
    }
    
    # Bật Funnel
    Write-Host "🔧 Enabling Tailscale Funnel for HTTPS on port 443 -> localhost:$Port..." -ForegroundColor Yellow
    try {
        # Dùng serve thay vì funnel để chỉ accessible trong tailnet
        tailscale serve --bg --https=443 $Port
        Write-Host "✅ Tailscale Serve enabled! Your app is now available at:" -ForegroundColor Green
        Write-Host "   https://$Domain" -ForegroundColor Cyan
        Write-Host "   (Accessible only within your Tailscale network)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to enable Tailscale Serve. Check your permissions." -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Setup-SelfSignedCert {
    Write-Host "🔧 Setting up Self-signed Certificate..." -ForegroundColor Yellow
    
    # Kiểm tra OpenSSL
    try {
        openssl version | Out-Null
        Write-Host "✅ OpenSSL found" -ForegroundColor Green
    } catch {
        Write-Host "❌ OpenSSL not found! Please install OpenSSL first." -ForegroundColor Red
        Write-Host "Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
        return $false
    }
    
    $keyFile = Join-Path $SslDir "private-key.pem"
    $csrFile = Join-Path $SslDir "cert.csr"
    $certFile = Join-Path $SslDir "certificate.pem"
    
    try {
        # Tạo private key
        Write-Host "🔑 Generating private key..." -ForegroundColor Yellow
        openssl genrsa -out $keyFile 2048
        
        # Tạo certificate signing request
        Write-Host "📝 Creating certificate signing request..." -ForegroundColor Yellow
        openssl req -new -key $keyFile -out $csrFile -subj "/CN=$Domain"
        
        # Tạo self-signed certificate (365 ngày)
        Write-Host "📜 Creating self-signed certificate..." -ForegroundColor Yellow
        openssl x509 -req -in $csrFile -signkey $keyFile -out $certFile -days 365
        
        # Cleanup CSR file
        Remove-Item $csrFile -Force
        
        Write-Host "✅ Self-signed certificate created successfully!" -ForegroundColor Green
        Write-Host "   Private Key: $keyFile" -ForegroundColor Cyan
        Write-Host "   Certificate: $certFile" -ForegroundColor Cyan
        Write-Host "   Valid for: 365 days" -ForegroundColor Yellow
        
        return $true
    } catch {
        Write-Host "❌ Failed to create self-signed certificate: $_" -ForegroundColor Red
        return $false
    }
}

function Show-NextSteps {
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "==============" -ForegroundColor Cyan
    
    if ($Method -eq "tailscale" -or $Method -eq "both") {
        Write-Host "📡 Tailscale Funnel:" -ForegroundColor Yellow
        Write-Host "   - Your app is accessible at: https://$Domain" -ForegroundColor Green
        Write-Host "   - No code changes needed in your app!" -ForegroundColor Green
        Write-Host "   - App continues running on HTTP localhost:$Port" -ForegroundColor Yellow
        Write-Host "   - To stop: tailscale serve --https=443 off" -ForegroundColor Gray
    }
    
    if ($Method -eq "self-signed" -or $Method -eq "both") {
        Write-Host "`n🔐 Self-signed Certificate:" -ForegroundColor Yellow
        Write-Host "   - Update server.js to use SSL certificates" -ForegroundColor Yellow
        Write-Host "   - Browser will show security warning (click 'Advanced' -> 'Proceed')" -ForegroundColor Yellow
        Write-Host "   - Certificate valid for 365 days" -ForegroundColor Gray
    }
    
    Write-Host "`n💡 Recommendation:" -ForegroundColor Magenta
    Write-Host "   Use Tailscale Funnel for the easiest setup!" -ForegroundColor Green
}

# Main execution
switch ($Method) {
    "tailscale" {
        if (Setup-TailscaleFunnel) {
            Write-Host "`n🎉 Tailscale Funnel setup completed!" -ForegroundColor Green
        }
    }
    "self-signed" {
        if (Setup-SelfSignedCert) {
            Write-Host "`n🎉 Self-signed certificate setup completed!" -ForegroundColor Green
        }
    }
    "both" {
        $tailscaleSuccess = Setup-TailscaleFunnel
        Write-Host ""
        $certSuccess = Setup-SelfSignedCert
        
        if ($tailscaleSuccess -or $certSuccess) {
            Write-Host "`n🎉 SSL setup completed!" -ForegroundColor Green
        }
    }
}

Show-NextSteps

Write-Host "`n🔗 Useful Commands:" -ForegroundColor Cyan
Write-Host "   tailscale status              - Check Tailscale connection" -ForegroundColor Gray
Write-Host "   tailscale serve status        - Check active serves" -ForegroundColor Gray
Write-Host "   tailscale serve --https=443 off - Stop HTTPS serving" -ForegroundColor Gray
