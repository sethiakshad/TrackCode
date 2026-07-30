/**
 * Supabase REST API-based database client.
 * Drop-in replacement for Prisma — uses the Supabase PostgREST API over HTTPS
 * instead of a direct PostgreSQL TCP connection (which fails due to IPv6-only DNS).
 *
 * Exports a Proxy object so that `prisma.MODEL.method(...)` calls are translated
 * into Supabase REST queries transparently.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuphdmszfdqkiddgjedw.supabase.co';
// Use SERVICE_ROLE_KEY to bypass RLS, just like Prisma admin connection did
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_6-YvgxEI9Sabj5UZYMqisA_7gA-7pv-';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Prisma model name → PostgREST table name mapping ──────────────────────────
// Models whose Prisma name differs from the DB table name (via @@map).
const TABLE_MAP = {
  public_users: 'users',
  auth_users: '__auth__',           // handled specially
  public_refresh_tokens: 'refresh_tokens',
};

// Models that live in the `auth` schema (not accessible via PostgREST)
const AUTH_SCHEMA_MODELS = new Set(['auth_users', 'identities', 'sessions',
  'mfa_factors', 'mfa_challenges', 'mfa_amr_claims', 'sso_providers',
  'sso_domains', 'saml_providers', 'saml_relay_states', 'flow_state',
  'audit_log_entries', 'refresh_tokens', 'one_time_tokens',
  'oauth_authorizations', 'oauth_consents',
  'webauthn_challenges', 'webauthn_credentials']);

function getTableName(model) {
  return TABLE_MAP[model] || model;
}

// ── Where-clause translator ───────────────────────────────────────────────────
function applyWhere(query, where) {
  if (!where) return query;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (val === null) {
      query = query.is(key, null);
    } else if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      // Check if it's a compound key (nested object without Prisma operators)
      const isPrismaOperator = Object.keys(val).some(op => ['gte', 'lte', 'gt', 'lt', 'in', 'not', 'contains', 'startsWith', 'equals'].includes(op));
      
      if (!isPrismaOperator && Object.keys(val).length > 0) {
        // It's a compound key (like user_id_date: { user_id, date })
        // Recursively apply these as equality filters
        query = applyWhere(query, val);
      } else {
        // Prisma operators
        for (const [op, operand] of Object.entries(val)) {
          switch (op) {
            case 'gte':   query = query.gte(key, operand instanceof Date ? operand.toISOString() : operand); break;
            case 'lte':   query = query.lte(key, operand instanceof Date ? operand.toISOString() : operand); break;
            case 'gt':    query = query.gt(key, operand instanceof Date ? operand.toISOString() : operand); break;
            case 'lt':    query = query.lt(key, operand instanceof Date ? operand.toISOString() : operand); break;
            case 'in':    query = query.in(key, operand); break;
            case 'not':   query = query.neq(key, operand); break;
            case 'contains':   query = query.ilike(key, `%${operand}%`); break;
            case 'startsWith': query = query.ilike(key, `${operand}%`); break;
            case 'equals': query = query.eq(key, operand); break;
            default: query = query.eq(key, operand);
          }
        }
      }
    } else {
      query = query.eq(key, val instanceof Date ? val.toISOString() : val);
    }
  }
  return query;
}

// ── OrderBy translator ────────────────────────────────────────────────────────
function applyOrderBy(query, orderBy) {
  if (!orderBy) return query;
  const items = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const item of items) {
    for (const [key, dir] of Object.entries(item)) {
      query = query.order(key, { ascending: dir === 'asc' });
    }
  }
  return query;
}

// ── Select / Include translator ───────────────────────────────────────────────
function buildSelectString(select, include) {
  if (select) {
    const fields = Object.entries(select)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    return fields.length > 0 ? fields.join(',') : '*';
  }
  if (include) {
    const relations = Object.entries(include).map(([rel, val]) => {
      if (val === true) return `${rel}(*)`;
      if (val && typeof val === 'object') {
        // handle nested select/take/orderBy
        let relSelect = '*';
        let parts = [`${rel}(`];
        if (val.select) {
          relSelect = Object.entries(val.select).filter(([,v]) => v).map(([k]) => k).join(',');
        }
        parts.push(relSelect);
        parts.push(')');
        return parts.join('');
      }
      return `${rel}(*)`;
    });
    return `*,${relations.join(',')}`;
  }
  return '*';
}

// ── Helper: Resolve Prisma atomic operations ────────────────────────────────────
function resolveAtomicOperations(payload, existingRow) {
  if (!existingRow) return payload;
  const resolved = { ...payload };
  for (const [key, val] of Object.entries(payload)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if (val.increment !== undefined) {
        resolved[key] = (existingRow[key] || 0) + val.increment;
      } else if (val.decrement !== undefined) {
        resolved[key] = (existingRow[key] || 0) - val.decrement;
      } else if (val.multiply !== undefined) {
        resolved[key] = (existingRow[key] || 0) * val.multiply;
      } else if (val.divide !== undefined) {
        resolved[key] = (existingRow[key] || 0) / val.divide;
      } else if (val.set !== undefined) {
        resolved[key] = val.set;
      }
    }
  }
  return resolved;
}

// ── Model proxy factory ───────────────────────────────────────────────────────
function createModelProxy(modelName) {
  const table = getTableName(modelName);
  const isAuth = AUTH_SCHEMA_MODELS.has(modelName);

  return {
    // ── findUnique ──────────────────────────────────────────────────────────
    async findUnique(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'findUnique', args);
      const { where, select, include } = args;
      const selectStr = buildSelectString(select, include);
      let q = supabase.from(table).select(selectStr);
      q = applyWhere(q, where);
      const { data, error } = await q.maybeSingle();
      if (error) {
        console.error(`[DB findUnique ${table}]`, error.message);
        return null;
      }
      return data;
    },

    // ── findFirst ───────────────────────────────────────────────────────────
    async findFirst(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'findFirst', args);
      const { where, select, include, orderBy } = args;
      const selectStr = buildSelectString(select, include);
      let q = supabase.from(table).select(selectStr);
      q = applyWhere(q, where);
      q = applyOrderBy(q, orderBy);
      q = q.limit(1);
      const { data, error } = await q.maybeSingle();
      if (error) {
        console.error(`[DB findFirst ${table}]`, error.message);
        return null;
      }
      return data;
    },

    // ── findMany ────────────────────────────────────────────────────────────
    async findMany(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'findMany', args);
      const { where, select, include, orderBy, take, skip } = args;
      const selectStr = buildSelectString(select, include);
      let q = supabase.from(table).select(selectStr);
      q = applyWhere(q, where);
      q = applyOrderBy(q, orderBy);
      if (take) q = q.limit(take);
      if (skip) q = q.range(skip, skip + (take || 1000) - 1);
      const { data, error } = await q;
      if (error) {
        console.error(`[DB findMany ${table}]`, error.message);
        return [];
      }
      return data || [];
    },

    // ── create ──────────────────────────────────────────────────────────────
    async create(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'create', args);
      const { data: payload, select: sel } = args;
      const selectStr = sel ? buildSelectString(sel) : '*';
      const { data, error } = await supabase.from(table).insert(payload).select(selectStr).single();
      if (error) {
        const err = new Error(`[DB create ${table}] ${error.message}`);
        err.code = error.code;
        throw err;
      }
      return data;
    },

    // ── update ──────────────────────────────────────────────────────────────
    async update(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'update', args);
      const { where, data: payload, select: sel } = args;
      const selectStr = sel ? buildSelectString(sel) : '*';
      
      // We must fetch existing row if there are atomic operations
      let eq = supabase.from(table).select('*');
      eq = applyWhere(eq, where);
      const { data: existing } = await eq.maybeSingle();
      
      const resolvedPayload = existing ? resolveAtomicOperations(payload, existing) : payload;

      let q = supabase.from(table).update(resolvedPayload).select(selectStr);
      q = applyWhere(q, where);
      const { data, error } = await q.single();
      if (error) {
        const err = new Error(`[DB update ${table}] ${error.message}`);
        err.code = error.code;
        throw err;
      }
      return data;
    },

    // ── upsert ──────────────────────────────────────────────────────────────
    async upsert(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'upsert', args);
      const { where, create: createData, update: updateData } = args;
      // Try to find existing
      let q = supabase.from(table).select('*');
      q = applyWhere(q, where);
      const { data: existing } = await q.maybeSingle();
      if (existing) {
        // Update
        const resolvedUpdate = resolveAtomicOperations(updateData, existing);
        let uq = supabase.from(table).update(resolvedUpdate).select('*');
        uq = applyWhere(uq, where);
        const { data, error } = await uq.single();
        if (error) {
          const err = new Error(`[DB upsert-update ${table}] ${error.message}`);
          err.code = error.code;
          throw err;
        }
        return data;
      } else {
        // Create
        const { data, error } = await supabase.from(table).insert(createData).select('*').single();
        if (error) {
          const err = new Error(`[DB upsert-create ${table}] ${error.message}`);
          err.code = error.code;
          throw err;
        }
        return data;
      }
    },

    // ── delete ──────────────────────────────────────────────────────────────
    async delete(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'delete', args);
      const { where } = args;
      let q = supabase.from(table).delete().select('*');
      q = applyWhere(q, where);
      const { data, error } = await q;
      if (error) {
        const err = new Error(`[DB delete ${table}] ${error.message}`);
        err.code = error.code;
        throw err;
      }
      return data?.[0] || null;
    },

    // ── deleteMany ──────────────────────────────────────────────────────────
    async deleteMany(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'deleteMany', args);
      const { where } = args;
      let q = supabase.from(table).delete();
      q = applyWhere(q, where);
      const { data, error } = await q;
      if (error) {
        console.error(`[DB deleteMany ${table}]`, error.message);
        return { count: 0 };
      }
      return { count: data?.length || 0 };
    },

    // ── count ───────────────────────────────────────────────────────────────
    async count(args = {}) {
      const { where } = args;
      let q = supabase.from(table).select('*', { count: 'exact', head: true });
      q = applyWhere(q, where);
      const { count, error } = await q;
      if (error) {
        console.error(`[DB count ${table}]`, error.message);
        return 0;
      }
      return count || 0;
    },

    // ── updateMany ──────────────────────────────────────────────────────────
    async updateMany(args = {}) {
      if (isAuth) return handleAuthQuery(modelName, 'updateMany', args);
      const { where, data: payload } = args;
      let q = supabase.from(table).update(payload);
      q = applyWhere(q, where);
      const { data, error } = await q;
      if (error) {
        console.error(`[DB updateMany ${table}]`, error.message);
        return { count: 0 };
      }
      return { count: data?.length || 0 };
    },
  };
}

// ── Auth schema handler ─────────────────────────────────────────────────────
// auth.users is not accessible via PostgREST; we use the Supabase Auth Admin API
// or fall back to a password-check flow via supabase.auth.signInWithPassword().
async function handleAuthQuery(model, method, args) {
  if (model === 'auth_users') {
    const where = args?.where || {};

    if (method === 'findUnique' || method === 'findFirst') {
      // For login, we need the encrypted_password.
      // Since we can't read auth.users with anon key, we return a stub
      // that lets the auth controller use supabase.auth.signInWithPassword() instead.
      if (where.id) {
        // Return a minimal auth user stub — the password check will be
        // handled by the auth controller using Supabase Auth API
        return { id: where.id, encrypted_password: '__supabase_auth__' };
      }
      if (where.email) {
        // Look up user by email in public schema first to get id
        const { data } = await supabase.from('users').select('id').eq('email', where.email).maybeSingle();
        if (data) return { id: data.id, email: where.email, encrypted_password: '__supabase_auth__', is_sso_user: false };
        return null;
      }
      return null;
    }

    if (method === 'create') {
      // Register: use Supabase Auth signup
      const payload = args?.data || {};
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload._rawPassword || 'temp_password',
      });
      if (error) {
        const err = new Error(`[Auth signUp] ${error.message}`);
        throw err;
      }
      return { id: data.user?.id || payload.id, email: payload.email };
    }

    if (method === 'update') {
      // Can't update auth.users without service_role key — log warning
      console.warn('[DB] Cannot update auth.users without service_role key');
      return { id: where?.id };
    }

    return null;
  }

  console.warn(`[DB] Auth-schema model "${model}" access attempted — not supported via REST`);
  return method.includes('Many') ? [] : null;
}

// ── Main Prisma-compatible proxy ────────────────────────────────────────────
const modelCache = {};

const prisma = new Proxy({}, {
  get(_, modelName) {
    // Special Prisma methods
    if (modelName === '$connect' || modelName === '$disconnect') return async () => {};
    if (modelName === '$transaction') {
      return async (fn) => {
        // Simple sequential execution (no real transaction support via REST)
        if (typeof fn === 'function') return fn(prisma);
        if (Array.isArray(fn)) return Promise.all(fn);
      };
    }
    if (modelName === 'then' || modelName === 'catch') return undefined;
    if (typeof modelName === 'symbol') return undefined;

    if (!modelCache[modelName]) {
      modelCache[modelName] = createModelProxy(modelName);
    }
    return modelCache[modelName];
  },
});

console.log('[DB] Using Supabase REST API (HTTPS) — bypassing direct PostgreSQL connection');

module.exports = prisma;
