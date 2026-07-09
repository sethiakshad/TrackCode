import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const hashToken = async (token: string) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const validateEnv = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase function secrets are missing.');
  }
};

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    validateEnv();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return jsonResponse({ error: 'Email and OTP are required.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpHash = await hashToken(String(otp).trim());

    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, is_verified')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return jsonResponse({ error: 'No pending registration found for this email.' }, { status: 404 });
    }

    if (user.is_verified) {
      return jsonResponse({ success: true, message: 'Email already verified.' });
    }

    const { data: verification, error: verificationError } = await admin
      .from('email_verifications')
      .select('id, token, expires_at, verified_at')
      .eq('user_id', user.id)
      .eq('email', normalizedEmail)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verificationError) {
      throw verificationError;
    }

    if (!verification) {
      return jsonResponse({ error: 'No active verification code found. Please request a new OTP.' }, { status: 404 });
    }

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: 'This OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (verification.token !== otpHash) {
      return jsonResponse({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    const verifiedAt = new Date().toISOString();

    const { error: verifyRecordError } = await admin
      .from('email_verifications')
      .update({ verified_at: verifiedAt })
      .eq('id', verification.id);

    if (verifyRecordError) {
      throw verifyRecordError;
    }

    const { error: verifyProfileError } = await admin
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id);

    if (verifyProfileError) {
      throw verifyProfileError;
    }

    const { error: verifyAuthError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (verifyAuthError) {
      throw verifyAuthError;
    }

    return jsonResponse({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error verifying OTP.';
    return jsonResponse({ error: message }, { status: 500 });
  }
});
