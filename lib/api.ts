const getApiBase = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove trailing slashes
    url = url.replace(/\/+$/, '');
    // Ensure it ends with /api if not already present
    if (!url.endsWith('/api')) {
        url = `${url}/api`;
    }
    return url;
};

const API_BASE = getApiBase();

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    };

    if (fetchOptions.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    if (!skipAuth && typeof window !== 'undefined') {
        const token = localStorage.getItem('hackjklu_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('hackjklu_token');
        localStorage.removeItem('hackjklu_admin');
        window.location.href = '/';
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    // Handle CSV downloads
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('text/csv')) {
        return res.text() as unknown as T;
    }

    return res.json();
}

// Auth
export const authApi = {
    login: (username: string, password: string) =>
        apiFetch<{ token: string; admin: { id: string; username: string; role: string } }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipAuth: true,
        }),
    me: () => apiFetch<{ _id: string; username: string; role: string }>('/auth/me'),
    createAdmin: (username: string, password: string, role: string) =>
        apiFetch('/auth/create', {
            method: 'POST',
            body: JSON.stringify({ username, password, role }),
        }),
};

// Teams
export const teamsApi = {
    list: (params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{
            teams: any[];
            pagination: { page: number; limit: number; total: number; pages: number };
        }>(`/teams${query}`);
    },
    get: (id: string) => apiFetch<any>(`/teams/${id}`),
    update: (id: string, data: any) =>
        apiFetch<any>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        apiFetch<any>(`/teams/${id}`, { method: 'DELETE' }),
    checkin: (id: string, target: string, memberIndex?: number) =>
        apiFetch<any>(`/teams/${id}/checkin`, {
            method: 'POST',
            body: JSON.stringify({ target, memberIndex }),
        }),
    swap: (fromTeamId: string, fromMemberIndex: number, toTeamId: string, toMemberIndex: number) =>
        apiFetch<any>('/teams/swap', {
            method: 'POST',
            body: JSON.stringify({ fromTeamId, fromMemberIndex, toTeamId, toMemberIndex }),
        }),
    import: (teams: any[]) =>
        apiFetch<any>('/teams/import', {
            method: 'POST',
            body: JSON.stringify({ teams }),
        }),
    importDevfolio: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch<{ message: string; imported: number; updated: number }>('/teams/import-devfolio', {
            method: 'POST',
            body: formData,
        });
    },
};

// Stats
export const statsApi = {
    get: () =>
        apiFetch<{
            teams: { total: number; complete: number; incomplete: number };
            participants: { total: number; checkedIn: number; notCheckedIn: number };
            batchBreakdown: Record<string, number>;
            courseBreakdown: Record<string, number>;
            messFoodCount: number;
        }>('/stats'),
};

// Exports
export const exportsApi = {
    teams: (params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<string>(`/exports/teams${query}`);
    },
    participants: (params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<string>(`/exports/participants${query}`);
    },
};

// Geography
export const geographyApi = {
    get: () =>
        apiFetch<{
            totalParticipants: number;
            states: {
                state: string;
                count: number;
                cities: { city: string; count: number }[];
            }[];
        }>('/geography'),
};

// Settings
export const settingsApi = {
    get: () => apiFetch<any>('/settings'),
    update: (data: any) =>
        apiFetch<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    logs: (params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ logs: any[]; pagination: any }>(`/settings/logs${query}`);
    },
};

// Download helper
export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
