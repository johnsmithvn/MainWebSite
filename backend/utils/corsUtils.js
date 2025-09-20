// 📁 backend/utils/corsUtils.js
// 🌐 CORS URL generation utilities

/**
 * 🔧 Generate CORS origins from hostnames and ports
 * Tự động tạo danh sách URLs từ hostnames và ports để tránh lặp lại
 * 
 * @param {string|string[]} hostnames - Hostname(s) to generate URLs for
 * @param {string|number|Array} ports - Port(s) to use
 * @param {Object} options - Generation options
 * @param {boolean} options.includeHttp - Include HTTP protocol (default: true)
 * @param {boolean} options.includeHttps - Include HTTPS protocol (default: false)
 * @returns {string[]} - Array of generated URLs
 * 
 * @example
 * generateCorsOrigins("localhost", [3000, 3001])
 * // ["http://localhost:3000", "http://localhost:3001"]
 * 
 * generateCorsOrigins(["localhost", "127.0.0.1"], 3000, { includeHttps: true })
 * // ["http://localhost:3000", "https://localhost:3000", "http://127.0.0.1:3000", "https://127.0.0.1:3000"]
 */
function generateCorsOrigins(hostnames, ports, options = {}) {
  const {
    includeHttp = true,
    includeHttps = false
  } = options;
  
  // Normalize inputs to arrays
  const hostnameList = Array.isArray(hostnames) ? hostnames : [hostnames];
  const portList = Array.isArray(ports) ? ports : [ports];
  
  const origins = [];
  
  for (const hostname of hostnameList) {
    for (const port of portList) {
      if (includeHttp) {
        origins.push(`http://${hostname}:${port}`);
      }
      if (includeHttps) {
        origins.push(`https://${hostname}:${port}`);
      }
    }
  }
  
  return origins;
}

/**
 * 🔧 Generate development CORS origins
 * Preset cho development với localhost variants
 * 
 * @param {Array} ports - Ports to include (default: [3000, 3001])
 * @param {boolean} includeHttps - Include HTTPS variants (default: false)
 * @returns {string[]} - Array of development URLs
 * 
 * @example
 * generateDevOrigins() 
 * // ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
 */
function generateDevOrigins(ports = [3000, 3001], includeHttps = false) {
  const devHostnames = ['localhost', '127.0.0.1'];
  return generateCorsOrigins(devHostnames, ports, { 
    includeHttp: true, 
    includeHttps 
  });
}

/**
 * 🔧 Generate Tailscale CORS origins
 * Preset cho Tailscale network access
 * 
 * @param {string} deviceName - Tailscale device name (e.g., "TAILSCALE_DEVICE")
 * @param {string} tailnetId - Tailnet ID (e.g., "TAILSCALE_TAILNET") 
 * @param {Array} ports - Ports to include (default: [3000, 3001])
 * @param {boolean} includeHttps - Include HTTPS variants (default: true)
 * @returns {string[]} - Array of Tailscale URLs
 * 
 * @example

 */
function generateTailscaleOrigins(deviceName, tailnetId, ports = [3000, 3001], includeHttps = true) {
  if (!deviceName || !tailnetId) {
    console.warn('⚠️ Missing deviceName or tailnetId for Tailscale origins');
    return [];
  }
  
  const tailscaleHostname = `${deviceName}.${tailnetId}.ts.net`;
  return generateCorsOrigins(tailscaleHostname, ports, {
    includeHttp: true,
    includeHttps
  });
}

/**
 * 🔧 Parse compact CORS configuration from environment
 * Parse format: "hostname:port1,port2|protocol"
 * 
 * @param {string} configString - Compact config string
 * @returns {string[]} - Array of generated URLs
 * 
 * @example
 * parseCompactCorsConfig("localhost:3000,3001|http")
 * // ["http://localhost:3000", "http://localhost:3001"]
 * 
 * parseCompactCorsConfig("mydevice.tailnet.ts.net:3000|http,https")
 * // ["http://mydevice.tailnet.ts.net:3000", "https://mydevice.tailnet.ts.net:3000"]
 */
function parseCompactCorsConfig(configString) {
  if (!configString || typeof configString !== 'string') {
    return [];
  }
  
  const origins = [];
  const entries = configString.split(';').filter(Boolean);
  
  for (const entry of entries) {
    const [hostPort, protocolsStr = 'http'] = entry.split('|');
    const [hostname, portsStr = '3000'] = hostPort.split(':');
    
    const ports = portsStr.split(',').map(p => p.trim());
    const protocols = protocolsStr.split(',').map(p => p.trim());
    
    for (const port of ports) {
      for (const protocol of protocols) {
        origins.push(`${protocol}://${hostname}:${port}`);
      }
    }
  }
  
  return origins;
}

module.exports = {
  generateCorsOrigins,
  generateDevOrigins,
  generateTailscaleOrigins,
  parseCompactCorsConfig
};
