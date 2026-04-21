import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getClientById, updateClient } from "@/lib/clients/store";
import { sendUpgradeConfirmationEmail } from "@/lib/email";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

/* ── POST /api/stripe/webhook ─ handle Stripe events ──
 *
 * Stripe posts events here. We verify the signature against
 * STRIPE_WEBHOOK_SECRET, then react to the events we care about.
 *
 * On checkout.session.completed (subscription mode):
 *   - extract client_id from session.metadata
 *   - update the client: tier='starter', trial_calls_limit=null,
 *     rate_limit_per_hour=1000
 *   - fire-and-forget confirmation email
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET missing — cannot verify");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Raw body required for signature verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(
    JSON.stringify({
      event: "stripe_webhook_received",
      type: event.type,
      id: event.id,
    })
  );

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        // Out of scope for Session 6. Log and ignore.
        console.log(
          JSON.stringify({ event: "stripe_webhook_ignored", type: event.type })
        );
        break;

      default:
        // Unknown event type — acknowledge so Stripe doesn't retry, but log.
        console.log(
          JSON.stringify({ event: "stripe_webhook_unhandled", type: event.type })
        );
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error handling ${event.type}:`, err);
    // Return 500 so Stripe retries. Only do this for transient failures.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clientId =
    session.metadata?.client_id ||
    (session.client_reference_id ? String(session.client_reference_id) : "");

  if (!clientId) {
    console.warn(
      "[stripe/webhook] checkout.session.completed without client_id",
      { session_id: session.id }
    );
    return;
  }

  const client = await getClientById(clientId);
  if (!client) {
    console.warn("[stripe/webhook] client not found for session", {
      session_id: session.id,
      client_id: clientId,
    });
    return;
  }

  const ok = await updateClient(clientId, {
    tier: "starter",
    trial_calls_limit: null, // unlimited
    rate_limit_per_hour: 1000,
    notes:
      (client.notes ? client.notes + "\n" : "") +
      `Upgraded via Stripe checkout session ${session.id} at ${new Date().toISOString()}`,
  });

  console.log(
    JSON.stringify({
      event: "client_upgraded_to_starter",
      client_id: clientId,
      email: client.email,
      session_id: session.id,
      ok,
    })
  );

  // Fire-and-forget confirmation email. Don't await — we want to ack the webhook fast.
  void sendUpgradeConfirmationEmail({ to: client.email, name: client.name });
}
