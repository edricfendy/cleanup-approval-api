const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { token, run_id } = req.query;

  const expectedToken = process.env.APPROVAL_SECRET;
  const computedToken = crypto
    .createHash('sha256')
    .update(`${run_id}-${expectedToken}`)
    .digest('hex');

  if (token !== computedToken) {
    return res.status(403).send('<h1>❌ Invalid Approval Token</h1>');
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
          client_payload: { run_id, approved_by: 'email', timestamp: new Date().toISOString() }
        }),
      }
    );

    if (response.ok) {
      return res.status(200).send('<h1>✅ Cleanup Approved!</h1>');
    } else {
      const text = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${text}`);
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).send(`<h1>❌ Error</h1><p>${error.message}</p>`);
  }
};
