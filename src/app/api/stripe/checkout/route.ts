import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { getStripe, STRIPE_PRICE_ID_STARTER } from "@/lib/stripe";
import { getClientById } from "@/lib/clients/store";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ── POST /api/stripe/checkout ─ create Checkout session ─
 * Body: { client_id: string }
 * Returns: { url: string } → frontend redirects to it.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Contact hello@artogroup.com." },
      { status: 503, headers: corsHeaders }
    );
  }
  if (!STRIPE_PRICE_ID_STARTER) {
    return NextResponse.json(
      { error: "Starter price ID is missing from server config." },
      { status: 503, headers: corsHeaders }
    );
  }

  let body: { client_id?: unknown };
  try {
    body = (await request.json()) as { client_id?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
  if (!clientId) {
    return NextResponse.json(
      { error: "client_id is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  const client = await getClientById(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "Unknown client_id. Sign up first at /." },
      { status: 404, headers: corsHeaders }
    );
  }
  if (!client.active) {
    return NextResponse.json(
      { error: "This account has been revoked. Contact hello@artogroup.com." },
      { status: 403, headers: corsHeaders }
    );
  }
  if (client.tier === "starter" || client.tier === "agency" || client.tier === "enterprise") {
    // Already paid — don't re-charge.
    return NextResponse.json(
      { error: `You're already on the ${client.tier} tier.`, already_paid: true },
      { status: 409, headers: corsHeaders }
    );
  }

  const origin = absoluteOrigin(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID_STARTER, quantity: 1 }],
      customer_email: client.email,
      client_reference_id: client.id,
      metadata: {
        client_id: client.id,
        client_email: client.email,
      },
      subscription_data: {
        metadata: {
          client_id: client.id,
          client_email: client.email,
        },
      },
      success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?client_id=${client.id}&canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502, headers: corsHeaders }
      );
    }

    console.log(
      JSON.stringify({
        event: "stripe_checkout_session_created",
        session_id: session.id,
        client_id: client.id,
        email: client.email,
      })
    );

    return NextResponse.json({ url: session.url, session_id: session.id }, { headers: corsHeaders });
  } catch (err) {
    console.error("[/api/stripe/checkout] Stripe error:", err);
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return NextResponse.json(
      { error: `Stripe error: ${message}` },
      { status: 502, headers: corsHeaders }
    );
  }
}

function absoluteOrigin(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "https");
  const host = request.headers.get("host") ?? request.nextUrl.host;
  return `${proto}://${host}`;
}
