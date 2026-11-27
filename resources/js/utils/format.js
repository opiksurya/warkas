// resources/js/utils/format.js

export function formatRp(value) {
    const num = Number(value || 0);
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export function calculateSellingPrice(costPrice, markupType, markupValue, autoRound = true) {
    const cost = Number(costPrice || 0);
    const val = Number(markupValue || 0);
    if (cost <= 0) return 0;

    let raw = markupType === 'percentage'
        ? cost + (cost * (val / 100))
        : cost + val;

    if (autoRound && raw > 0) {
        return Math.ceil(raw / 100) * 100;
    }
    return Math.round(raw);
}

export async function apiFetch(url, options = {}) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || data.error || 'Terjadi kesalahan pada server');
    }
    return data;
}
