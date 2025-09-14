// 📁 ssl/create-ssl.js
// Script đơn giản tạo SSL certificate cho HTTPS

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Creating SSL certificates for HTTPS...');

// Tạo thư mục ssl nếu chưa có
const sslDir = path.join(__dirname);
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

try {
  // Tạo certificate bằng PowerShell (Windows)
  console.log('🔑 Generating certificate with PowerShell...');
  
  const psScript = `
    $cert = New-SelfSignedCertificate -DnsName "desktop-v88j9e0.tail2b3d3b.ts.net", "localhost" -CertStoreLocation "cert:\\CurrentUser\\My" -KeyExportPolicy Exportable -NotAfter (Get-Date).AddDays(365);
    $pwd = ConvertTo-SecureString -String "123456" -Force -AsPlainText;
    Export-PfxCertificate -Cert $cert -FilePath "${sslDir}/certificate.pfx" -Password $pwd;
    Write-Host "Certificate created: $($cert.Thumbprint)"
  `;
  
  execSync(`powershell -Command "${psScript}"`, { stdio: 'inherit' });
  
  console.log('✅ SSL Certificate created successfully!');
  console.log('📁 Files created:');
  console.log('   - certificate.pfx (can be used with Node.js)');
  console.log('');
  console.log('🚀 Now you can run HTTPS server:');
  console.log('   cd backend && node severv2.js');
  
} catch (error) {
  console.error('❌ Error creating certificate:', error.message);
  console.log('');
  console.log('💡 Manual alternative:');
  console.log('   1. Run as Administrator: PowerShell');
  console.log('   2. Run the PowerShell commands manually');
  console.log('   3. Or use the simplified setup below');
}
