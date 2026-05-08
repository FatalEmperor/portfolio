// ─────────────────────────────────────────────────────────────────
// Supabase auth — wraps the Supabase JS client and exposes a tiny
// global API consumed by script.js (signup, signin, signinGoogle,
// signout, resetPassword, getUser, onChange).
// ─────────────────────────────────────────────────────────────────
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const sb = window.supabase;
  if (!sb || !cfg.url || !cfg.anonKey || cfg.url.includes('YOUR-PROJECT-REF')) {
    console.warn('[auth] Supabase not configured — auth-config.js needs real values.');
    window.haseebAuth = { ready: false };
    return;
  }

  const client = sb.createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const listeners = new Set();
  client.auth.onAuthStateChange((_evt, session) => {
    listeners.forEach((fn) => { try { fn(session?.user || null); } catch {} });
  });

  function nameOf(user) {
    if (!user) return null;
    return (
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Student'
    );
  }

  window.haseebAuth = {
    ready: true,

    async getUser() {
      const { data } = await client.auth.getUser();
      return data?.user || null;
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signup({ name, email, phone, password }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone: phone || null },
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) throw error;
      return {
        user: data.user,
        needsVerification: !data.session,
      };
    },

    async signin({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: data.user };
    },

    async signinGoogle() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    },

    async signout() {
      await client.auth.signOut();
    },

    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html',
      });
      if (error) throw error;
    },

    async updatePassword(newPassword) {
      const { data, error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    },

    nameOf,
    _client: client,
  };
})();
