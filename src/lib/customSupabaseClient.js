// This file is deprecated and will be deleted. All data logic will use PHP backend only.
// customSupabaseClient is no longer used.
// Please remove any references to this client in your application.
// Lightweight adapter that forwards calls to the PHP backend APIs at http://localhost:8000
// This implements only the subset of Supabase methods used by the frontend.

// Allow overriding from Vite env (VITE_API_BASE). Default to 127.0.0.1 to avoid
// possible localhost/IPv6 resolution issues on some dev machines.
const API_BASE = (import.meta.env?.VITE_API_BASE) || 'http://localhost:8000';

const auth = {
    signInWithPassword: async ({ email, password }) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        let data;
        try { data = await res.json(); } catch (e) {
            const text = await res.text();
            return { error: { message: 'Invalid JSON response', raw: text } };
        }
        if (!res.ok) return { error: data };
        return { data };
    },
    signOut: async () => {
        const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        let data;
        try { data = await res.json(); } catch (e) {
            const text = await res.text();
            return { error: { message: 'Invalid JSON response', raw: text } };
        }
        return { error: data.error || null };
    },
    updateUser: async (payload) => {
        const res = await fetch(`${API_BASE}/auth/session`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) {
            return { error: { message: 'Invalid JSON response', raw: text } };
        }
        if (!res.ok) return { error: data };
        return { data };
    },
    getSession: async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/session`, { credentials: 'include' });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) {
                return { data: null, error: { message: 'Invalid JSON response', raw: text } };
            }
            return { data };
        } catch (err) {
            // Network error (server unreachable, CORS, etc.)
            return { data: null, error: { message: err.message } };
        }
    },
    onAuthStateChange: (cb) => {
        // Minimal implementation: poll session every 2s and invoke callback on change
        let lastUser = null;
        const check = async () => {
            const { data } = await auth.getSession();
            const user = data.user ?? null;
            if (JSON.stringify(user) !== JSON.stringify(lastUser)) {
                lastUser = user;
                cb('STATE_CHANGE', { session: { user } });
            }
        };
        const iv = setInterval(check, 2000);
        check();
        // Always return the exact Supabase shape: { data: { subscription: { unsubscribe } } }
        return { data: { subscription: { unsubscribe: () => clearInterval(iv) } } };
    }
};

const storage = {
    from: (bucket) => ({
        upload: async (path, file, opts = {}) => {
            // Expect `file` to be a File object from browser. Use FormData
            const fd = new FormData();
            fd.append('file', file);
            fd.append('path', path);
            const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', credentials: 'include', body: fd });
            let data;
            try { data = await res.json(); } catch (e) {
                const text = await res.text();
                return { error: { message: 'Invalid JSON response', raw: text } };
            }
            if (!res.ok) return { error: data };
            return { error: null };
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `${API_BASE}/institute-assets/${path}` } }),
        remove: async (paths) => {
            // Accept array of paths or single path. We will delete one by one.
            const list = Array.isArray(paths) ? paths : [paths];
            for (const p of list) {
                const res = await fetch(`${API_BASE}/uploads`, { method: 'DELETE', credentials: 'include', body: new URLSearchParams({ path: p }) });
                let d;
                try { d = await res.json(); } catch (e) {
                    const text = await res.text();
                    return { error: { message: 'Invalid JSON response', raw: text } };
                }
                if (!res.ok) return { error: d };
            }
            return { error: null };
        }
    })
};

// Minimal from()/select/insert/update/delete chain used in app
const from = (table) => {
    // Return a chainable query builder with select/eq/order/maybeSingle/single
    const builder = {
        _table: table,
        _filters: {},
        _order: null,
        _limit: null,
        select(cols = '*') {
            this._cols = cols; return this;
        },
        eq(col, val) { this._filters[col] = val; return this; },
        order(col) { this._order = col; return this; },
        limit(n) { this._limit = n; return this; },
        async maybeSingle() { const r = await this._exec(); return { data: (r && r.length ? r[0] : null) }; },
        async single() { const r = await this._exec(); return { data: (r && r.length ? r[0] : null) }; },
        async order(col) { this._order = col; return { data: await this._exec() }; },
        async _exec() {
            if (this._table === 'institutes') {
                const res = await fetch(`${API_BASE}/institutes`, { credentials: 'include' });
                try { return await res.json(); } catch (e) { return []; }
            }
            if (this._table === 'website_team') {
                const inst = this._filters['institute_id'];
                const res = await fetch(`${API_BASE}/website/team?institute_id=${encodeURIComponent(inst)}`, { credentials: 'include' });
                try { return await res.json(); } catch (e) { return []; }
            }
            if (this._table === 'website_gallery') {
                const inst = this._filters['institute_id'];
                const res = await fetch(`${API_BASE}/website/gallery?institute_id=${encodeURIComponent(inst)}`, { credentials: 'include' });
                try { return await res.json(); } catch (e) { return []; }
            }
            if (this._table === 'website_documents') {
                const inst = this._filters['institute_id'];
                const res = await fetch(`${API_BASE}/website/documents?institute_id=${encodeURIComponent(inst)}`, { credentials: 'include' });
                try { return await res.json(); } catch (e) { return []; }
            }
            if (this._table === 'website_events') {
                const inst = this._filters['institute_id'];
                const res = await fetch(`${API_BASE}/website/events?institute_id=${encodeURIComponent(inst)}`, { credentials: 'include' });
                try { return await res.json(); } catch (e) { return []; }
            }
            if (this._table === 'website_carousel') {
                const inst = this._filters['institute_id'];
                const res = await fetch(`${API_BASE}/website/carousel?institute_id=${encodeURIComponent(inst)}`, { credentials: 'include' });
                return await res.json();
            }
            if (this._table === 'roles') {
                const res = await fetch(`${API_BASE}/roles`, { credentials: 'include' });
                return await res.json();
            }
            if (this._table === 'employees') {
                const inst = this._filters['institute_id'];
                const url = inst ? `${API_BASE}/employees?institute_id=${encodeURIComponent(inst)}` : `${API_BASE}/employees`;
                const res = await fetch(url, { credentials: 'include' });
                return await res.json();
            }
            if (this._table === 'website_content') {
                const inst = this._filters['institute_id'];
                const page = this._filters['page'];
                const section = this._filters['section'] || 'main';
                const res = await fetch(`${API_BASE}/website/content?institute_id=${encodeURIComponent(inst)}&page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}`, { credentials: 'include' });
                let d;
                try { d = await res.json(); } catch (e) { return []; }
                return [d.content];
            }
            // default: route to generic CRUD endpoint
            try {
                const params = new URLSearchParams(this._filters).toString();
                const url = `${API_BASE}/${this._table}` + (params ? `?${params}` : '');
                const res = await fetch(url, { credentials: 'include' });
                if (!res.ok) return [];
                try { return await res.json(); } catch (e) { return []; }
            } catch (e) {
                return [];
            }
        },
        async insert(payload) {
            if (this._table === 'website_team' || this._table === 'website_content' || this._table === 'website_gallery' || this._table === 'website_documents' || this._table === 'website_events' || this._table === 'website_carousel' || this._table === 'roles' || this._table === 'employees') {
                let url;
                switch (this._table) {
                    case 'website_team': url = `${API_BASE}/website/team`; break;
                    case 'website_content': url = `${API_BASE}/website/content`; break;
                    case 'website_gallery': url = `${API_BASE}/website/gallery`; break;
                    case 'website_documents': url = `${API_BASE}/website/documents`; break;
                    case 'website_events': url = `${API_BASE}/website/events`; break;
                    case 'website_carousel': url = `${API_BASE}/website/carousel`; break;
                    case 'roles': url = `${API_BASE}/roles`; break;
                    case 'employees': url = `${API_BASE}/employees`; break;
                }
                const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                let data;
                try { data = await res.json(); } catch (e) { return { error: { message: 'Invalid JSON response' } }; }
                return { error: data.error || null };
            }
            return { error: null };
        },
        match(obj) { this._match = obj; return this; },
        async update(payload) {
            if (['website_team', 'website_gallery', 'website_documents', 'website_events', 'website_carousel', 'employees'].includes(this._table)) {
                let url = `${API_BASE}/` + (this._table === 'employees' ? 'employees' : `website/${this._table.split('_')[1]}`);
                if (this._table === 'roles') url = `${API_BASE}/roles`;
                const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                let data;
                try { data = await res.json(); } catch (e) { return { error: { message: 'Invalid JSON response' } }; }
                return { error: data.error || null };
            }
            return { error: null };
        },
        delete() {
            // Support .delete().eq('id', value)
            return {
                eq: async (col, val) => {
                    if (col !== 'id') return { error: 'only id deletion supported' };
                    let url = `${API_BASE}/` + (this._table === 'employees' ? 'employees' : `website/${this._table.split('_')[1]}`);
                    if (this._table === 'roles') url = `${API_BASE}/roles`;
                    const res = await fetch(url, { method: 'DELETE', credentials: 'include', body: new URLSearchParams({ id: val }) });
                    const d = await res.json();
                    return { error: d.error || null };
                }
            };
        },
        async upsert(payload, opts) { return await this.insert(payload); }
    };
    return builder;
};

export const supabase = {
    auth,
    storage,
    from,
};