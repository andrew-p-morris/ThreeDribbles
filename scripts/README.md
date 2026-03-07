# Scripts

## Local Stripe webhook (testing only)

Test Stripe webhooks on your machine before the backend is deployed.

1. **Start the listener**
   ```bash
   node scripts/stripe-webhook-local.js
   ```

2. **In another terminal, forward Stripe events**
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```
   (Requires [Stripe CLI](https://stripe.com/docs/stripe-cli) and `stripe login`.)

3. **Trigger a test event**
   ```bash
   stripe trigger checkout.session.completed
   ```

You should see the event logged in the first terminal. For production, use the real webhook URL from your deployed backend.
