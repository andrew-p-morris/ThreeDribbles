/**
 * Local Stripe webhook listener for testing only.
 * Run: node scripts/stripe-webhook-local.js
 * Then: stripe listen --forward-to localhost:4242/webhook
 * Trigger: stripe trigger checkout.session.completed
 *
 * For production, the real webhook runs on your backend (e.g. Cloud Function).
 */

import http from 'http';

const PORT = 4242;

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      const event = JSON.parse(body);
      console.log('[Stripe] Event received:', event.type, event.id);
      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object;
        console.log('[Stripe] Checkout completed:', {
          id: session?.id,
          client_reference_id: session?.client_reference_id,
          metadata: session?.metadata,
        });
      }
    } catch (e) {
      console.error('[Stripe] Parse error:', e.message);
    }
    res.writeHead(200);
    res.end();
  });
});

server.listen(PORT, () => {
  console.log(`Local webhook listener: http://localhost:${PORT}/webhook`);
  console.log('Run in another terminal: stripe listen --forward-to localhost:4242/webhook');
});
