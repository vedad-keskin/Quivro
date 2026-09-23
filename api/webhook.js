import crypto from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * Lemon Squeezy webhook. Writes the purchase record that EntitlementService reads.
 *
 * Uses the Web-standard handler signature so `request.text()` returns the exact
 * bytes Lemon Squeezy signed. The classic (req, res) signature would risk Vercel
 * parsing the body first, which loses the byte-for-byte payload the HMAC covers.
 *
 * Required env vars: LEMONSQUEEZY_WEBHOOK_SECRET, FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */

const COLLECTION = 'purchases';

export function GET() {
  return Response.json({ status: 'Quivro webhook is running', accepts: 'POST only' });
}

export async function POST(request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!secret || !projectId || !clientEmail || !privateKey) {
    console.error('[webhook] Missing environment variables');
    return Response.json({ error: 'Server not configured' }, { status: 500 });
  }

  const rawBody = await request.text();

  const signature = request.headers.get('x-signature');
  if (!signature || !isValidSignature(rawBody, signature, secret)) {
    console.error('[webhook] Invalid or missing signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  const uid = event.meta?.custom_data?.firebase_uid;
  const attributes = event.data?.attributes ?? {};

  if (eventName !== 'order_created' && eventName !== 'order_refunded') {
    return Response.json({ message: `Ignored ${eventName}` });
  }

  // The store also sells Nightfall, and Lemon Squeezy delivers every store event
  // to every webhook in that store. Bow out of sibling products before the uid
  // check below, otherwise each Nightfall sale would land here as a failed
  // delivery and bury real failures in the dashboard.
  if (event.meta?.custom_data?.app !== 'quivro') {
    return Response.json({ message: 'Not a Quivro order' });
  }

  // Without a uid there is no account to credit. 400 so it shows as failed in
  // the Lemon Squeezy dashboard rather than silently succeeding.
  if (!uid) {
    console.error('[webhook] No firebase_uid in custom_data', JSON.stringify(event.meta));
    return Response.json({ error: 'Missing firebase_uid' }, { status: 400 });
  }

  const refunded = eventName === 'order_refunded' || attributes.refunded === true;
  if (!refunded && attributes.status !== 'paid') {
    console.log(`[webhook] Order status "${attributes.status}" is not paid, skipping`);
    return Response.json({ message: 'Non-paid order ignored' });
  }

  try {
    const db = firestore({ projectId, clientEmail, privateKey });
    await db.collection(COLLECTION).doc(uid).set(
      {
        uid,
        email: attributes.user_email ?? event.meta?.custom_data?.email ?? null,
        orderId: String(event.data?.id ?? ''),
        totalFormatted: attributes.total_formatted ?? null,
        active: !refunded,
        source: 'lemonsqueezy',
        updatedAt: FieldValue.serverTimestamp(),
        ...(refunded ? {} : { purchaseDate: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    console.log(`[webhook] ${eventName} recorded for ${uid} (active=${!refunded})`);
    return Response.json({ message: 'OK' });
  } catch (error) {
    console.error('[webhook] Firestore write failed', error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

function isValidSignature(rawBody, signature, secret) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function firestore({ projectId, clientEmail, privateKey }) {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Vercel stores the key with literal \n sequences.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}
