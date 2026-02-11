// api/approve-cleanup.js
// Deploy this to Vercel (free) to enable email-only approval

export default async function handler(req, res) {
  const { token, run_id } = req.query;
  
  // Security: Verify the approval token
  const expectedToken = process.env.APPROVAL_SECRET;
  const computedToken = require('crypto')
    .createHash('sha256')
    .update(`${run_id}-${expectedToken}`)
    .digest('hex');
  
  if (token !== computedToken) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Invalid Token</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid Approval Token</h1>
          <p>This approval link is invalid or has expired.</p>
        </body>
      </html>
    `);
  }
  
  // Trigger GitHub workflow via repository_dispatch
  const owner = process.env.GITHUB_OWNER; // e.g., 'edricfendy'
  const repo = process.env.GITHUB_REPO;   // e.g., 'Final'
  const githubToken = process.env.GITHUB_TOKEN; // Personal Access Token
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'approve-cleanup',
          client_payload: {
            run_id: run_id,
            approved_by: 'email',
            timestamp: new Date().toISOString()
          }
        })
      }
    );
    
    if (response.ok) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cleanup Approved</title>
            <meta http-equiv="refresh" content="3;url=https://github.com/${owner}/${repo}/actions">
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Cleanup Approved!</h1>
            <p>The database cleanup has been triggered successfully.</p>
            <p>Run ID: ${run_id}</p>
            <p>Redirecting to GitHub Actions...</p>
            <a href="https://github.com/${owner}/${repo}/actions">View Workflow →</a>
          </body>
        </html>
      `);
    } else {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Error</h1>
          <p>Failed to trigger cleanup workflow.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
}
