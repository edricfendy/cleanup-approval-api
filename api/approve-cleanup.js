const crypto = require('crypto');
const fetch = require('node-fetch');

// In-memory store for used tokens (for production, use Redis or database)
const usedTokens = new Map();

module.exports = async (req, res) => {
  const { token, run_id, expiry } = req.query;
  
  // Validate required parameters
  if (!token || !run_id) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <title>Invalid Request</title>
        <style>
          :root {
            color-scheme: light dark;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 48px 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            .container {
              background: #1f2937;
            }
            h1, p {
              color: #f9fafb;
            }
          }
          .icon {
            font-size: 56px;
            margin-bottom: 20px;
            opacity: 0.9;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 12px;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          p {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠️</div>
          <h1>Invalid Request</h1>
          <p>Missing required parameters. Please use the link from your approval email.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  // Check if token has expired
  if (expiry) {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = parseInt(expiry);
    
    if (currentTime > expiryTime) {
      const expiredDate = new Date(expiryTime * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <title>Token Expired</title>
          <style>
            :root { color-scheme: light dark; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
              padding: 48px 32px;
              max-width: 480px;
              width: 100%;
              text-align: center;
            }
            @media (prefers-color-scheme: dark) {
              .container { background: #1f2937; }
              h1, p, .info-text { color: #f9fafb; }
              .info-box { background: #374151; border-left-color: #fbbf24; }
            }
            .icon { font-size: 56px; margin-bottom: 20px; opacity: 0.9; }
            h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; font-weight: 600; }
            p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
            .info-box {
              background: #fef3c7;
              border-left: 3px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              text-align: left;
            }
            .info-text { font-size: 13px; color: #78350f; line-height: 1.5; }
            .help-list { margin: 16px 0; padding-left: 20px; }
            .help-list li { margin: 8px 0; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⏰</div>
            <h1>Token Expired</h1>
            <p>This approval link has expired and can no longer be used.</p>
            <div class="info-box">
              <p class="info-text"><strong>Expired:</strong> ${expiredDate}</p>
            </div>
            <p><strong>Next Steps</strong></p>
            <ul class="help-list">
              <li>Wait for next scheduled cleanup (Sunday 9 AM WIB)</li>
              <li>Or manually trigger cleanup from GitHub Actions</li>
            </ul>
          </div>
        </body>
        </html>
      `);
    }
  }
  
  // Check if token has been used
  const tokenKey = `${run_id}-${token}`;
  if (usedTokens.has(tokenKey)) {
    const usedAt = usedTokens.get(tokenKey);
    
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <title>Token Already Used</title>
        <style>
          :root { color-scheme: light dark; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 48px 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            .container { background: #1f2937; }
            h1, p, .info-text { color: #f9fafb; }
            .info-box { background: #374151; border-left-color: #60a5fa; }
          }
          .icon { font-size: 56px; margin-bottom: 20px; opacity: 0.9; }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; font-weight: 600; }
          p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
          .info-box {
            background: #dbeafe;
            border-left: 3px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: left;
          }
          .info-text { font-size: 13px; color: #1e40af; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Token Already Used</h1>
          <p>This approval link has already been used and cannot be used again.</p>
          <div class="info-box">
            <p class="info-text"><strong>First used:</strong> ${usedAt}</p>
          </div>
          <p>Each approval link can only be used once for security reasons.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  // Validate token
  const expectedToken = process.env.APPROVAL_SECRET;
  const computedToken = crypto
    .createHash('sha256')
    .update(`${run_id}-${expectedToken}`)
    .digest('hex');
  
  if (token !== computedToken) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <title>Invalid Token</title>
        <style>
          :root { color-scheme: light dark; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 48px 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            .container { background: #1f2937; }
            h1, p { color: #f9fafb; }
          }
          .icon { font-size: 56px; margin-bottom: 20px; opacity: 0.9; }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; font-weight: 600; }
          p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Invalid Token</h1>
          <p>This approval link is invalid or has been modified.</p>
          <p>Please use the original link from your email.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  // Mark token as used
  usedTokens.set(tokenKey, new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }));
  
  // Trigger GitHub Actions workflow
  try {
    const response = await fetch(
      \`https://api.github.com/repos/\${process.env.GITHUB_OWNER}/\${process.env.GITHUB_REPO}/dispatches\`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': \`token \${process.env.GITHUB_TOKEN}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'approve-cleanup',
          client_payload: { 
            run_id, 
            token,
            expiry,
            approved_by: 'email', 
            timestamp: new Date().toISOString() 
          }
        }),
      }
    );
    
    if (response.ok) {
      const formattedDate = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let expiryInfo = '';
      if (expiry) {
        const expiryTime = parseInt(expiry);
        const currentTime = Math.floor(Date.now() / 1000);
        const hoursRemaining = Math.floor((expiryTime - currentTime) / 3600);
        expiryInfo = \`<tr class="metadata-row">
          <td class="metadata-label">Expires In</td>
          <td class="metadata-value">\${hoursRemaining}h</td>
        </tr>\`;
      }
      
      return res.status(200).send(\`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <title>Cleanup Approved</title>
          <style>
            :root { color-scheme: light dark; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
              padding: 48px 32px;
              max-width: 520px;
              width: 100%;
              text-align: center;
              animation: slideUp 0.4s ease-out;
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-color-scheme: dark) {
              .container { background: #1f2937; }
              h1, .metadata-label, .metadata-value { color: #f9fafb; }
              .subtitle { color: #9ca3af; }
              .metadata-table { border-top: 1px solid #374151; }
              .metadata-row { border-bottom: 1px solid #374151; }
              .info-box { background: #1e3a8a; border-left-color: #60a5fa; }
            }
            .icon-wrapper {
              width: 64px;
              height: 64px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
            }
            .icon { font-size: 32px; }
            h1 {
              color: #1f2937;
              font-size: 28px;
              margin-bottom: 8px;
              font-weight: 600;
              letter-spacing: -0.025em;
            }
            .subtitle {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .metadata-table {
              width: 100%;
              margin: 32px 0;
              border-top: 1px solid #e5e7eb;
            }
            .metadata-row {
              display: flex;
              justify-content: space-between;
              padding: 16px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .metadata-row:last-child { border-bottom: none; }
            .metadata-label {
              font-size: 14px;
              color: #6b7280;
              font-weight: 500;
            }
            .metadata-value {
              font-size: 14px;
              color: #1f2937;
              font-weight: 600;
            }
            .info-box {
              background: #dbeafe;
              border-left: 3px solid #3b82f6;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              text-align: left;
            }
            .info-text {
              font-size: 13px;
              color: #1e40af;
              line-height: 1.5;
              margin: 0;
            }
            .button {
              display: inline-block;
              margin-top: 24px;
              padding: 12px 24px;
              background: #1f2937;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #9ca3af;
            }
            @media (prefers-color-scheme: dark) {
              .footer { border-top-color: #374151; }
              .button { background: #374151; }
              .button:hover { background: #4b5563; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-wrapper">
              <div class="icon">✓</div>
            </div>
            <h1>Cleanup Approved</h1>
            <p class="subtitle">The database cleanup workflow has been triggered successfully.</p>
            
            <div class="metadata-table">
              <div class="metadata-row">
                <span class="metadata-label">Run ID</span>
                <span class="metadata-value">#\${run_id}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">Approved</span>
                <span class="metadata-value">\${formattedDate}</span>
              </div>
              \${expiryInfo}
            </div>
            
            <div class="info-box">
              <p class="info-text">The cleanup process is now running. You will receive an email notification once it completes (typically 2-5 minutes).</p>
            </div>
            
            <a href="https://github.com/\${process.env.GITHUB_OWNER}/\${process.env.GITHUB_REPO}/actions" class="button">View on GitHub</a>
            
            <p class="footer">This approval link has been used and cannot be reused.</p>
          </div>
        </body>
        </html>
      \`);
    } else {
      throw new Error(\`GitHub API error: \${response.status}\`);
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).send(\`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <title>Approval Failed</title>
        <style>
          :root { color-scheme: light dark; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 48px 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            .container { background: #1f2937; }
            h1, p { color: #f9fafb; }
            .error-box { background: #7f1d1d; border-left-color: #fca5a5; }
          }
          .icon { font-size: 56px; margin-bottom: 20px; opacity: 0.9; }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; font-weight: 600; }
          p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
          .error-box {
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: left;
          }
          code {
            font-family: 'SF Mono', 'Monaco', monospace;
            font-size: 12px;
            color: #dc2626;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✕</div>
          <h1>Approval Failed</h1>
          <p>There was an error triggering the cleanup workflow.</p>
          <div class="error-box">
            <code>\${error.message}</code>
          </div>
          <p>Please check your Vercel environment variables and GitHub Actions settings.</p>
        </div>
      </body>
      </html>
    \`);
  }
};
