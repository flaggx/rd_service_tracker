// A minimal API client for cookie-based auth via Nginx proxying to /api.
// - Uses credentials: "include" so session cookies are sent.
// - Encodes JSON automatically unless you pass FormData.
// - Throws on non-2xx with a rich error including status and response body.
//
// Usage examples:
//   import { api, apiFetch } from "./fetch";
//   await api.auth.login({ username, password });
//   const tickets = await api.tickets.list({ page: 1, pageSize: 50 });
//   // or use apiFetch directly:
//   await apiFetch("/auth/login", { method: "POST", data: { username, password } });

// Use Vite's env variable if available, otherwise fallback to "/api"
const API_BASE =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_API_BASE) ||
    "/api";

/**
 * Build a URL with optional query params
 * @param {string} path
 * @param {Record<string, any>|undefined} query
 * @returns {string}
 */
function buildUrl(path, query) {
    const url = new URL(
        String(path).startsWith("http") ? path : `${API_BASE}${path}`,
        window.location.origin
    );
    if (query && typeof query === "object") {
        Object.entries(query).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            url.searchParams.set(k, String(v));
        });
    }
    return url.toString();
}

/**
 * Core request helper
 * @param {string} path
 * @param {{
 *   method?: string,
 *   data?: any,
 *   headers?: Record<string, string>,
 *   query?: Record<string, any>,
 *   signal?: AbortSignal
 * }} opts
 */
async function request(path, { method = "GET", data, headers = {}, query, signal } = {}) {
    const url = buildUrl(path, query);
    const init = {
        method,
        credentials: "include",
        headers: { ...headers },
        signal
    };

    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

    if (data !== undefined) {
        if (isFormData) {
            init.body = data; // let browser set Content-Type with boundary
        } else {
            init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
            init.body = JSON.stringify(data);
        }
    }

    const res = await fetch(url, init);

    // Handle empty responses
    if (res.status === 204) return undefined;

    const contentType = res.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
        const err = new Error((isJson && body?.message) || `Request failed with status ${res.status}`);
        err.status = res.status;
        err.body = body;
        err.url = url;
        throw err;
    }

    return body;
}

// Expose a named export for direct use in components that import { apiFetch }
export const apiFetch = request;

// Convenience HTTP verbs
const http = {
    get: (path, opts) => request(path, { ...opts, method: "GET" }),
    post: (path, data, opts) => request(path, { ...opts, method: "POST", data }),
    put: (path, data, opts) => request(path, { ...opts, method: "PUT", data }),
    del: (path, opts) => request(path, { ...opts, method: "DELETE" })
};

// Domain-specific API wrappers
export const api = {
    auth: {
        /**
         * Log in with username/password (sets session cookie)
         * @param {{username: string, password: string}} payload
         */
        login(payload) {
            return http.post("/auth/login", payload);
        },
        /**
         * Log out and clear session
         */
        logout() {
            return http.post("/auth/logout");
        }
    },

    tickets: {
        /**
         * List tickets with optional pagination
         * @param {{page?: number, pageSize?: number}} [query]
         */
        list(query) {
            return http.get("/tickets", { query });
        },

        /**
         * Create a ticket
         * @param {{
         *   accountName: string,
         *   city: string,
         *   contactPerson?: string,
         *   contactInfo?: string,
         *   priority?: "HIGH"|"MEDIUM"|"LOW" | "high"|"medium"|"low",
         *   workType?: "INSTALL"|"REMOVAL" | "install"|"removal",
         *   lease?: boolean,
         *   underWarranty?: boolean,
         *   machineModelOrType?: string,
         *   issueDescription?: string,
         *   requestingTechName?: string,
         *   pictures?: string[]
         * }} payload
         */
        create(payload) {
            // Normalize enums to uppercase for server-side Prisma enums
            const normalized = {
                ...payload,
                priority: payload.priority ? String(payload.priority).toUpperCase() : undefined,
                workType: payload.workType ? String(payload.workType).toUpperCase() : undefined
            };
            return http.post("/tickets", normalized);
        },

        /**
         * Update a ticket by id (partial update)
         * @param {number} id
         * @param {Partial<{
         *   accountName: string,
         *   city: string,
         *   contactPerson: string,
         *   contactInfo: string,
         *   priority: "HIGH"|"MEDIUM"|"LOW" | "high"|"medium"|"low",
         *   workType: "INSTALL"|"REMOVAL" | "install"|"removal",
         *   lease: boolean,
         *   underWarranty: boolean,
         *   machineModelOrType: string,
         *   issueDescription: string,
         *   requestingTechName: string,
         *   pictures: string[]
         * }>} payload
         */
        update(id, payload) {
            const normalized = {
                ...payload,
                priority: payload?.priority ? String(payload.priority).toUpperCase() : undefined,
                workType: payload?.workType ? String(payload.workType).toUpperCase() : undefined
            };
            return http.put(`/tickets/${id}`, normalized);
        }
    }
};

export default api;