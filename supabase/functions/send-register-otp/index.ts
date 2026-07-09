import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';
import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const resend = new Resend(resendApiKey);
const OTP_EXPIRY_MINUTES = 10;
const OTP_PURPOSES = new Set(['register', 'login']);

const buildAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const normalizeUsername = (value: string) => {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (base.length >= 3) {
    return base.slice(0, 30);
  }

  return `${base || 'user'}_${crypto.randomUUID().slice(0, 6)}`.slice(0, 30);
};

const isUsernameTaken = async (username: string) => {
  const { data, error } = await admin.from('users').select('id').eq('username', username).maybeSingle();
  if (error) throw error;
  return !!data;
};

const ensureAvailableUsername = async (seed: string) => {
  const base = normalizeUsername(seed);

  if (!(await isUsernameTaken(base))) {
    return base;
  }

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const suffix = `_${crypto.randomUUID().slice(0, 6)}`;
    const candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`;
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error('Unable to reserve a unique username right now.');
};

const generateOtp = () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] % 1_000_000).toString().padStart(6, '0');
};

const hashToken = async (token: string) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const validateEnv = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase function secrets are missing.');
  }

  if (!resendApiKey || !resendFromEmail) {
    throw new Error('Resend secrets are missing. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
  }
};

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    validateEnv();

    const { mode = 'register', name, email, password, username, avatar } = await request.json();

    if (!OTP_PURPOSES.has(mode)) {
      return jsonResponse({ error: 'Unsupported OTP mode.' }, { status: 400 });
    }

    if (!email || !password || (mode === 'register' && !name)) {
      return jsonResponse({ error: 'Required registration details are missing.' }, { status: 400 });
    }

    if (password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const fallbackUsername = normalizeUsername(username || name || normalizedEmail.split('@')[0]);
    const avatarUrl = avatar || buildAvatarUrl(name || normalizedEmail);

    const { data: existingUser, error: existingUserError } = await admin
      .from('users')
      .select('id, email, is_verified, username')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    if (mode === 'register' && existingUser?.is_verified) {
      return jsonResponse({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }

    let userId = existingUser?.id;
    let subject = 'Your TrackCode verification code';
    let heading = 'Verify your TrackCode account';
    let bodyCopy = 'Use this one-time password to finish creating your account:';

    if (mode === 'login') {
      if (!existingUser) {
        return jsonResponse({ error: 'No account found with this email. Please sign up first.' }, { status: 404 });
      }

      if (!existingUser.is_verified) {
        return jsonResponse({ error: 'Please complete email verification before signing in.' }, { status: 403 });
      }

      const { error: signInError } = await admin.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        return jsonResponse({ error: 'Invalid email or password.' }, { status: 401 });
      }

      subject = 'Your TrackCode login code';
      heading = 'Finish signing in to TrackCode';
      bodyCopy = 'Use this one-time password to complete your login:';
    } else {
      const resolvedUsername =
        existingUser?.username || (await ensureAvailableUsername(fallbackUsername));

      if (existingUser) {
        const { error: updateAuthError } = await admin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: false,
          user_metadata: {
            name,
            username: resolvedUsername,
            avatar: avatarUrl,
          },
        });

        if (updateAuthError) {
          throw updateAuthError;
        }

        const { error: updateProfileError } = await admin
          .from('users')
          .update({
            username: resolvedUsername,
            avatar: avatarUrl,
            is_verified: false,
          })
          .eq('id', existingUser.id);

        if (updateProfileError) {
          throw updateProfileError;
        }
      } else {
        const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: false,
          user_metadata: {
            name,
            username: resolvedUsername,
            avatar: avatarUrl,
          },
        });

        if (createUserError) {
          throw createUserError;
        }

        userId = createdUser.user?.id;
      }
    }

    if (!userId) {
      throw new Error('Failed to prepare the OTP challenge.');
    }

    if (mode === 'register' && existingUser) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: false,
        user_metadata: {
          name,
          username: resolvedUsername,
          avatar: avatarUrl,
        },
      });

      if (updateAuthError) {
        throw updateAuthError;
      }

      const { error: updateProfileError } = await admin
        .from('users')
        .update({
          username: resolvedUsername,
          avatar: avatarUrl,
          is_verified: false,
        })
        .eq('id', existingUser.id);

      if (updateProfileError) {
        throw updateProfileError;
      }
    }

    const otp = generateOtp();
    const tokenHash = await hashToken(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: cleanupError } = await admin
      .from('email_verifications')
      .delete()
      .eq('user_id', userId)
      .eq('purpose', mode)
      .is('verified_at', null);

    if (cleanupError) {
      throw cleanupError;
    }

    const { error: verificationInsertError } = await admin.from('email_verifications').insert({
      user_id: userId,
      email: normalizedEmail,
      token: tokenHash,
      purpose: mode,
      expires_at: expiresAt,
    });

    if (verificationInsertError) {
      throw verificationInsertError;
    }

    const { error: mailError } = await resend.emails.send({
      from: resendFromEmail,
      to: normalizedEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">${heading}</h2>
          <p>${bodyCopy}</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0; color: #2563eb;">
            ${otp}
          </div>
          <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
      text: `${bodyCopy} ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    if (mailError) {
      throw mailError;
    }

    return jsonResponse(
      {
        success: true,
        message: 'Verification code sent successfully.',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error sending OTP.';
    return jsonResponse({ error: message }, { status: 500 });
  }
});
