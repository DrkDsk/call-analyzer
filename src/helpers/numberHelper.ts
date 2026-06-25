export function formatNumber(value: number) {
    return new Intl.NumberFormat('es-MX').format(value)
}

export function formatDuration(value: number) {
    return `${new Intl.NumberFormat('es-MX', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(value)} m`
}