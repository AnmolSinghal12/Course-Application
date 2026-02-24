const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSize = 1024;
const primaryColor = '#3B82F6'; // Vibrant blue
const tasselColor = '#FCD34D'; // Yellow

const createIconSVG = () => {
  const size = iconSize;
  const center = size / 2;
  
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Shadow for graduation cap -->
    <filter id="capShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${size * 0.008}"/>
      <feOffset dx="0" dy="${size * 0.006}" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.4"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Speech Bubble Background -->
  <path d="M ${center - size * 0.35} ${center - size * 0.2} 
           Q ${center - size * 0.35} ${center - size * 0.3} ${center - size * 0.25} ${center - size * 0.3}
           L ${center + size * 0.25} ${center - size * 0.3}
           Q ${center + size * 0.35} ${center - size * 0.3} ${center + size * 0.35} ${center - size * 0.2}
           L ${center + size * 0.35} ${center + size * 0.2}
           Q ${center + size * 0.35} ${center + size * 0.3} ${center + size * 0.25} ${center + size * 0.3}
           L ${center - size * 0.25} ${center + size * 0.3}
           Q ${center - size * 0.35} ${center + size * 0.3} ${center - size * 0.35} ${center + size * 0.2}
           Z" 
        fill="${primaryColor}"/>
  
  <!-- Speech Bubble Tail (pointing down) -->
  <path d="M ${center - size * 0.1} ${center + size * 0.2}
           L ${center} ${center + size * 0.3}
           L ${center + size * 0.1} ${center + size * 0.2}
           Z" 
        fill="${primaryColor}"/>
  
  <!-- "LMS" Text - Bold White -->
  <text x="${center}" y="${center + size * 0.08}" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.18}" 
        font-weight="bold" 
        fill="#FFFFFF" 
        text-anchor="middle"
        letter-spacing="${size * 0.008}">LMS</text>
  
  <!-- Graduation Cap - Black, positioned on top right -->
  <g transform="translate(${center + size * 0.12}, ${center - size * 0.25})" filter="url(#capShadow)">
    <!-- Cap Base (flat top) -->
    <rect x="${-size * 0.15}" y="${-size * 0.08}" 
          width="${size * 0.3}" height="${size * 0.06}" 
          rx="${size * 0.01}" fill="#000000"/>
    
    <!-- Cap Top (mortarboard) -->
    <path d="M ${-size * 0.15} ${-size * 0.08} 
             L ${-size * 0.12} ${-size * 0.14}
             L ${size * 0.12} ${-size * 0.14}
             L ${size * 0.15} ${-size * 0.08} Z" 
          fill="#1F2937"/>
    
    <!-- Cap Side (for 3D effect) -->
    <path d="M ${size * 0.12} ${-size * 0.14} 
             L ${size * 0.15} ${-size * 0.08}
             L ${size * 0.12} ${-size * 0.02}
             L ${size * 0.09} ${-size * 0.08} Z" 
          fill="#111827"/>
    
    <!-- Button on top center -->
    <circle cx="0" cy="${-size * 0.11}" r="${size * 0.012}" fill="#374151"/>
    
    <!-- Yellow Tassel -->
    <g>
      <!-- Tassel string -->
      <line x1="0" y1="${-size * 0.11}" 
            x2="${size * 0.08}" y2="${size * 0.12}" 
            stroke="${tasselColor}" 
            stroke-width="${size * 0.01}" 
            stroke-linecap="round"/>
      
      <!-- Tassel end (hanging down) -->
      <circle cx="${size * 0.08}" cy="${size * 0.12}" r="${size * 0.018}" fill="${tasselColor}"/>
      
      <!-- Tassel decorative lines -->
      <line x1="${size * 0.08}" y1="${size * 0.12}" 
            x2="${size * 0.06}" y2="${size * 0.16}" 
            stroke="${tasselColor}" 
            stroke-width="${size * 0.008}" 
            stroke-linecap="round"/>
      <line x1="${size * 0.08}" y1="${size * 0.12}" 
            x2="${size * 0.1}" y2="${size * 0.16}" 
            stroke="${tasselColor}" 
            stroke-width="${size * 0.008}" 
            stroke-linecap="round"/>
    </g>
  </g>
</svg>`;
};

const generateIcons = async () => {
  const assetsDir = path.join(__dirname, '..', 'assets');
 
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const svg = createIconSVG();
  const svgBuffer = Buffer.from(svg);
  
  try {
  
    await sharp(svgBuffer)
      .resize(iconSize, iconSize)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    
    console.log(' Generated icon.png (1024x1024)');
    
    const adaptiveSize = iconSize;
    const safeZone = Math.round(adaptiveSize * 0.1); 
    const contentSize = adaptiveSize - (safeZone * 2);
    
    await sharp(svgBuffer)
      .resize(contentSize, contentSize)
      .extend({
        top: safeZone,
        bottom: safeZone,
        left: safeZone,
        right: safeZone,
        background: { r: 59, g: 130, b: 246 } // #3B82F6
      })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    
    console.log(' Generated adaptive-icon.png (1024x1024 with safe zone)');
    
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    
    console.log('Generated favicon.png (512x512)');
    
    await sharp(svgBuffer)
      .resize(2048, 2048)
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 255, g: 255, b: 255 } 
      })
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    
    console.log(' Generated splash.png (2048x2048)');
    
    console.log('\n All icons generated successfully!');
    console.log(' Icon design: Speech Bubble with Graduation Cap (Modern LMS theme)');
    console.log(' Features: Blue speech bubble, bold LMS text, black graduation cap with yellow tassel');
    
  } catch (error) {
    console.error(' Error generating icons:', error);
    process.exit(1);
  }
};

generateIcons();
