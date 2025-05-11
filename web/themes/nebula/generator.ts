/**
 * Generator for Nebula dark cards theme
 * Converts MVPContentData to static HTML/CSS
 */
import { MVPContentData } from '../../types/mvp';
import { GeneratedOutput, ThemeGenerator } from '../index';

/**
 * Generate static HTML/CSS for Nebula theme
 */
const generateNebulaHTML: ThemeGenerator = (data: MVPContentData): GeneratedOutput => {
  const { profile, links } = data;
  
  // Convert links to HTML
  const linksHTML = links.map(link => {
    // Get appropriate icon
    const iconSVG = getIconSVG(link.icon);
    
    return `
      <a href="${escapeHTML(link.url)}" class="link-card" target="_blank" rel="noopener noreferrer">
        <div class="link-icon">${iconSVG}</div>
        <div class="link-text">${escapeHTML(link.text)}</div>
      </a>
    `;
  }).join('\n');
  
  // Generate complete HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(profile.name)} - Link-in-Bio</title>
  <meta name="description" content="${escapeHTML(profile.headline)}">
  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      background: linear-gradient(135deg, #1a0b2e 0%, #2a1b3e 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      color: white;
    }
    
    .container {
      max-width: 1000px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 30px;
      padding: 40px 20px;
    }
    
    @media (min-width: 768px) {
      .container {
        flex-direction: row;
        align-items: flex-start;
      }
    }
    
    /* Profile styles */
    .profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      flex: 1;
    }
    
    @media (min-width: 768px) {
      .profile {
        align-items: flex-start;
        text-align: left;
      }
    }
    
    .avatar {
      width: 220px;
      height: 220px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(123, 64, 255, 0.25);
      background-color: rgba(123, 64, 255, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .name {
      font-size: 1.6rem;
      font-weight: 700;
      color: white;
      margin-bottom: 6px;
    }
    
    .headline {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
      font-size: 1rem;
    }
    
    .location {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
    }
    
    .location svg {
      margin-right: 8px;
    }
    
    /* Links section */
    .links-section {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    
    .links-title {
      font-size: 1.2rem;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .links-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    
    .link-card {
      display: flex;
      align-items: center;
      background: rgba(26, 11, 46, 0.75);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(123, 64, 255, 0.1);
      box-shadow: 0 4px 20px rgba(123, 64, 255, 0.15);
      border-radius: 8px;
      padding: 16px;
      color: white;
      text-decoration: none;
      transition: all 0.2s ease-in-out;
    }
    
    .link-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(123, 64, 255, 0.25);
      border-color: rgba(123, 64, 255, 0.3);
    }
    
    .link-icon {
      margin-right: 16px;
      color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .link-icon svg {
      width: 24px;
      height: 24px;
    }
    
    .link-text {
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 40px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.75rem;
    }
    
    .footer a {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Profile Section -->
    <div class="profile">
      <div class="avatar">
        <!-- Avatar would go here in production - using placeholder for now -->
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      </div>
      
      <h1 class="name">${escapeHTML(profile.name)}</h1>
      <p class="headline">${escapeHTML(profile.headline)}</p>
      
      <div class="location">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <span>London/Paris</span>
      </div>
    </div>
    
    <!-- Links Section -->
    <div class="links-section">
      <h2 class="links-title">Links</h2>
      
      <div class="links-container">
        ${linksHTML}
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Generated with <a href="https://github.com/socrabytes/quickfolio" target="_blank">Quickfolio</a></p>
  </div>
</body>
</html>`;

  return {
    content: html,
    filename: 'index.html',
    fileType: 'html',
    mimeType: 'text/html'
  };
};

/**
 * Get SVG icon markup for a given icon name
 */
function getIconSVG(iconName?: string): string {
  if (!iconName) return '';
  
  switch (iconName.toLowerCase()) {
    case 'linkedin':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>`;
    case 'github':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
      </svg>`;
    case 'twitter':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
      </svg>`;
    case 'blog':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>`;
    case 'envelope':
    case 'email':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
      </svg>`;
  }
}

/**
 * Helper function to escape HTML entities
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default generateNebulaHTML;
