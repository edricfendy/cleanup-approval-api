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
        <title>Invalid Request</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 60px 40px;
            max-width: 500px;
            text-align: center;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 16px;
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
  
  // NEW FEATURE 3: Check if token has expired (7-day expiration)
  if (expiry) {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = parseInt(expiry);
    
    if (currentTime > expiryTime) {
      const expiredDate = new Date(expiryTime * 1000).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Token Expired</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              padding: 60px 40px;
              max-width: 500px;
              text-align: center;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1f2937;
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            p {
              color: #6b7280;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .error-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              font-size: 14px;
              color: #78350f;
            }
            .help-list {
              text-align: left;
              margin: 15px 0;
              padding-left: 20px;
            }
            .help-list li {
              color: #6b7280;
              margin: 8px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⏰</div>
            <h1>Token Expired</h1>
            <p>This approval link has expired and can no longer be used.</p>
            <div class="error-box">
              <strong>Expiration Details:</strong><br>
              Expired at: ${expiredDate}<br>
              Current time: ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
            </div>
            <p><strong>What to do:</strong></p>
            <ul class="help-list">
              <li>Wait for the next scheduled cleanup (Sunday 9 AM WIB)</li>
              <li>Or manually trigger a new cleanup from GitHub Actions</li>
            </ul>
          </div>
        </body>
        </html>
      `);
    }
  }
  
  // NEW FEATURE 4: Check if token has been used before (prevent reuse)
  const tokenKey = `${run_id}-${token}`;
  if (usedTokens.has(tokenKey)) {
    const usedAt = usedTokens.get(tokenKey);
    
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Token Already Used</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 60px 40px;
            max-width: 500px;
            text-align: center;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
            color: #991b1b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Token Already Used</h1>
          <p>This approval link has already been used and cannot be used again.</p>
          <div class="error-box">
            <strong>Usage Details:</strong><br>
            First used at: ${usedAt}<br>
            Run ID: ${run_id}
          </div>
          <p><strong>Security Notice:</strong></p>
          <p>Each approval link can only be used once for security reasons. If you need to run cleanup again, please wait for the next scheduled run or manually trigger a new cleanup workflow.</p>
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
        <title>Invalid Token</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 60px 40px;
            max-width: 500px;
            text-align: center;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
            color: #991b1b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Invalid Approval Token</h1>
          <p>This approval link is invalid or has already been used.</p>
          <div class="error-box">
            <strong>Possible reasons:</strong><br>
            • The link has already been clicked<br>
            • The link has expired<br>
            • The link was modified
          </div>
          <p>Please use the original link from your email or request a new approval.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  // NEW FEATURE 4: Mark token as used (prevent reuse)
  usedTokens.set(tokenKey, new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }));
  
  // Trigger GitHub Actions workflow
  try {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
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
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      // Calculate time remaining until expiry (if provided)
      let expiryInfo = '';
      if (expiry) {
        const expiryTime = parseInt(expiry);
        const currentTime = Math.floor(Date.now() / 1000);
        const hoursRemaining = Math.floor((expiryTime - currentTime) / 3600);
        expiryInfo = `<div class="detail-item">
          <span class="label">Token Expires In</span>
          <span class="value">${hoursRemaining} hours</span>
        </div>`;
      }
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cleanup Approved</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              padding: 60px 40px;
              max-width: 600px;
              text-align: center;
              animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 30px;
              animation: scaleIn 0.5s ease-out 0.2s both;
            }
            @keyframes scaleIn {
              from { transform: scale(0); }
              to { transform: scale(1); }
            }
            .icon svg {
              width: 50px;
              height: 50px;
              stroke: white;
              stroke-width: 3;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            h1 {
              color: #1f2937;
              font-size: 32px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .subtitle {
              color: #6b7280;
              font-size: 18px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .detail {
              background: #f9fafb;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-item:last-child { border-bottom: none; }
            .label {
              color: #6b7280;
              font-size: 14px;
              font-weight: 500;
            }
            .value {
              color: #1f2937;
              font-weight: 600;
              font-size: 14px;
              text-align: right;
            }
            .status-badge {
              background: #d1fae5;
              color: #065f46;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 13px;
              font-weight: 600;
            }
            .info-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              text-align: left;
            }
            .info-box h3 {
              color: #1e40af;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .info-box p {
              color: #1e3a8a;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #9ca3af;
            }
            .github-link {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: #1f2937;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: background 0.2s;
            }
            .github-link:hover {
              background: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h1>✅ Cleanup Approved!</h1>
            <p class="subtitle">The database cleanup workflow has been triggered successfully.</p>
            <p class="subtitle">You will receive an email notification once the cleanup is complete.</p>
            
            <div class="detail">
              <div class="detail-item">
                <span class="label">Run ID</span>
                <span class="value">${run_id}</span>
              </div>
              <div class="detail-item">
                <span class="label">Status</span>
                <span class="value"><span class="status-badge">⏳ In Progress</span></span>
              </div>
              <div class="detail-item">
                <span class="label">Approved At</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-item">
                <span class="label">Approved By</span>
                <span class="value">Email Link</span>
              </div>
              ${expiryInfo}
            </div>
            
            <div class="info-box">
              <h3>📊 What's Happening Now?</h3>
              <p>GitHub Actions is executing the cleanup script with a final verification step. This process typically takes 2-5 minutes depending on the database size. You'll receive a detailed email report when it's complete.</p>
            </div>
            
            <a href="https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions" class="github-link" target="_blank">
              📈 View Live Progress on GitHub
            </a>
            
            <div class="footer">
              🔒 This approval link has been used and cannot be used again.<br>
              You can safely close this window.
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      const text = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${text}`);
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approval Failed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 60px 40px;
            max-width: 600px;
            text-align: center;
          }
          .icon {
            width: 80px;
            height: 80px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 48px;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
          }
          .error-box h3 {
            color: #991b1b;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .error-box code {
            background: #fef2f2;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            color: #7f1d1d;
            word-break: break-all;
          }
          .help-list {
            text-align: left;
            margin: 20px 0;
            padding-left: 20px;
          }
          .help-list li {
            color: #6b7280;
            margin: 8px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Approval Failed</h1>
          <p>There was an error triggering the cleanup workflow.</p>
          
          <div class="error-box">
            <h3>Error Details:</h3>
            <code>${error.message}</code>
          </div>
          
          <p><strong>Common Issues:</strong></p>
          <ul class="help-list">
            <li>GitHub token may have expired or lacks permissions</li>
            <li>Repository name might be incorrect</li>
            <li>Network connectivity issues</li>
            <li>GitHub API rate limits</li>
          </ul>
          
          <p style="margin-top: 25px; font-weight: 600;">
            Please check your Vercel environment variables and GitHub Actions logs.
          </p>
        </div>
      </body>
      </html>
    `);
  }
};
