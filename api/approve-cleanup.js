const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { token, run_id } = req.query;
  
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root { color-scheme: light dark; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 48px 32px;
            max-width: 480px;
            text-align: center;
          }
          .icon {
            font-size: 56px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0f172a; }
            .container { background: #1e293b; border-color: #334155; }
            h1 { color: #f1f5f9; }
            p { color: #cbd5e1; }
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root { color-scheme: light dark; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 48px 32px;
            max-width: 520px;
            text-align: center;
          }
          .icon {
            font-size: 56px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
            color: #991b1b;
            line-height: 1.6;
          }
          .error-box strong {
            display: block;
            margin-bottom: 8px;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0f172a; }
            .container { background: #1e293b; border-color: #334155; }
            h1 { color: #f1f5f9; }
            p { color: #cbd5e1; }
            .error-box { background: #450a0a; border-left-color: #dc2626; color: #fecaca; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Invalid Approval Token</h1>
          <p>This approval link is invalid or has already been used.</p>
          <div class="error-box">
            <strong>Possible reasons:</strong>
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
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <title>Cleanup Approved</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            :root { color-scheme: light dark; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: #f5f7fa;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              padding: 48px 32px;
              max-width: 600px;
              text-align: center;
              animation: slideUp 0.4s ease-out;
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .icon {
              width: 72px;
              height: 72px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              animation: scaleIn 0.4s ease-out 0.2s both;
            }
            @keyframes scaleIn {
              from { transform: scale(0); }
              to { transform: scale(1); }
            }
            .icon svg {
              width: 40px;
              height: 40px;
              stroke: white;
              stroke-width: 3;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            h1 {
              color: #1f2937;
              font-size: 28px;
              margin-bottom: 12px;
              font-weight: 600;
            }
            .subtitle {
              color: #6b7280;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 8px;
            }
            .detail {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              margin: 28px 0;
              text-align: left;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
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
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
            }
            .info-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 18px;
              margin: 24px 0;
              text-align: left;
            }
            .info-box h3 {
              color: #1e40af;
              font-size: 15px;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .info-box p {
              color: #1e3a8a;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
            }
            .footer {
              margin-top: 28px;
              padding-top: 18px;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #9ca3af;
              line-height: 1.6;
            }
            .github-link {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 28px;
              background: #1f2937;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 15px;
              transition: all 0.2s;
            }
            .github-link:hover {
              background: #374151;
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            @media (prefers-color-scheme: dark) {
              body { background: #0f172a; }
              .container { background: #1e293b; border-color: #334155; }
              h1 { color: #f1f5f9; }
              .subtitle { color: #cbd5e1; }
              .detail { background: #0f172a; border-color: #334155; }
              .detail-item { border-bottom-color: #334155; }
              .label { color: #94a3b8; }
              .value { color: #f1f5f9; }
              .status-badge { background: #064e3b; color: #6ee7b7; }
              .info-box { background: #1e3a8a; border-left-color: #3b82f6; }
              .info-box h3 { color: #93c5fd; }
              .info-box p { color: #dbeafe; }
              .footer { border-top-color: #334155; color: #94a3b8; }
              .github-link { background: #374151; }
              .github-link:hover { background: #4b5563; }
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
            </div>
            
            <div class="info-box">
              <h3>📊 What's Happening Now?</h3>
              <p>GitHub Actions is executing the cleanup script. This process typically takes 2-5 minutes depending on the database size. You'll receive a detailed email report when it's complete.</p>
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
        <meta name="color-scheme" content="light dark">
        <title>Approval Failed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          :root { color-scheme: light dark; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 48px 32px;
            max-width: 600px;
            text-align: center;
          }
          .icon {
            width: 72px;
            height: 72px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          h1 {
            color: #1f2937;
            font-size: 26px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 18px;
            margin: 24px 0;
            text-align: left;
          }
          .error-box h3 {
            color: #991b1b;
            font-size: 15px;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .error-box code {
            background: #fef2f2;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            color: #7f1d1d;
            word-break: break-all;
            display: block;
            margin-top: 8px;
            line-height: 1.5;
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
            line-height: 1.5;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0f172a; }
            .container { background: #1e293b; border-color: #334155; }
            .icon { background: #dc2626; }
            h1 { color: #f1f5f9; }
            p { color: #cbd5e1; }
            .error-box { background: #450a0a; border-left-color: #dc2626; }
            .error-box h3 { color: #fca5a5; }
            .error-box code { background: #7f1d1d; color: #fecaca; }
            .help-list li { color: #94a3b8; }
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
          
          <p style="font-weight: 600;">Common Issues:</p>
          <ul class="help-list">
            <li>GitHub token may have expired or lacks permissions</li>
            <li>Repository name might be incorrect</li>
            <li>Network connectivity issues</li>
            <li>GitHub API rate limits</li>
          </ul>
          
          <p style="margin-top: 24px; font-weight: 600;">
            Please check your Vercel environment variables and GitHub Actions logs.
          </p>
        </div>
      </body>
      </html>
    `);
  }
};
