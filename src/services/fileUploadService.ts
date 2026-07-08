import apiClient from './apiClient'

export type PhoneEventsSummary = {
    total_events: number
    total_calls: number
    incoming_calls_count: number
    outgoing_calls_count: number
    total_messages: number
    total_data: number
    total_duration: number
    average_duration: number
    unique_contacts: number
    top_contact: string | number | null
    peak_hour: string | null
    active_days: number
}

export type ImportResult = {
    id: number
    status: string
    progress: number
    original_filename?: string
}

export type PhoneEvent = {
    id: number
    import_id: number
    contact: string
    number: string
    phone?: string | null
    number_a?: string | null
    number_b?: string | null
    type?: string | null
    duration?: number | string | null
    date?: string | null
    time?: string | null
    first_seen_at: string | null
    last_seen_at: string | null
    call_direction?: 'incoming' | 'outgoing' | string | null
    calls_count: number
    messages_count: number
    data_count: number
    created_at: string
    updated_at: string
}

export type PaginationLinks = {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
}

export type PaginationMetaLink = {
    url: string | null
    label: string
    page: number | null
    active: boolean
}

export type PaginationMeta = {
    current_page: number
    from: number | null
    last_page: number
    links: PaginationMetaLink[]
    path: string
    per_page: number
    to: number | null
    total: number
}

export type PaginatedResponse<T> = {
    data: T[]
    links: PaginationLinks
    meta: PaginationMeta
}

export type PhoneEventsPaginatedResponse = PaginatedResponse<PhoneEvent>

export type CallDirectionFilter = 'all' | 'incoming' | 'outgoing' | 'unknown'

export type PhoneEventsAnalyticsDirection = 'incoming' | 'outgoing' | 'unknown' | null

export type PhoneEventsAnalyticsRow = {
    date: string
    label: string
    incoming: number
    outgoing: number
    unknown: number
    total: number
}

export type PhoneEventsAnalyticsMeta = {
    type: 'call'
    group_by: 'date'
    metric: 'count'
    direction: PhoneEventsAnalyticsDirection
    incoming: number
    outgoing: number
    unknown: number
    total: number
}

export type PhoneEventsAnalyticsResponse = {
    data: PhoneEventsAnalyticsRow[]
    meta: PhoneEventsAnalyticsMeta
}

export type AnalyzePhoneEventsResponse = {
    data: {
        import: ImportResult | null
        summary: PhoneEventsSummary
        phone_events?: PhoneEvent[]
    }
}

type ImportIdResponse = {
    data?: {
        import?: Pick<ImportResult, 'id'> | null
        import_id?: number | string
        id?: number | string
    }
    import?: Pick<ImportResult, 'id'> | null
    import_id?: number | string
    id?: number | string
}

function parseImportId(value: unknown): number | null {
    const id = Number(value)

    return Number.isFinite(id) && id > 0 ? id : null
}

export function extractImportId(response: ImportIdResponse): number | null {
    return (
        parseImportId(response.data?.import?.id) ??
        parseImportId(response.import?.id) ??
        parseImportId(response.import_id) ??
        parseImportId(response.id) ??
        parseImportId(response.data?.import_id) ??
        parseImportId(response.data?.id) ??
        null
    )
}

export async function analyzePhoneEventsFile(
    file: File,
    persistSummary: boolean,
): Promise<AnalyzePhoneEventsResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('persist_summary', persistSummary ? '1' : '0')

    const response = await apiClient.post<AnalyzePhoneEventsResponse>('/imports/phone-events/analyze', formData)

    return response.data
}

export async function loadAnalyzeEvents(importId: number): Promise<AnalyzePhoneEventsResponse> {
    const response = await apiClient.get<AnalyzePhoneEventsResponse>(`/process/${importId}/show`)

    return response.data
}

export async function loadAnalyzeEventsAnalytics(
    importId: number | string,
    direction: CallDirectionFilter = 'all',
): Promise<PhoneEventsAnalyticsResponse> {
    const response = await apiClient.get<PhoneEventsAnalyticsResponse>(`/process/${importId}/events/analytics`, {
        params: {
            type: 'call',
            group_by: 'date',
            metric: 'count',
            ...(direction !== 'all' ? {direction} : {}),
        },
    })

    return response.data
}

export async function loadPhoneEvents(
    importId: number | string,
    page = 1,
): Promise<PhoneEventsPaginatedResponse> {
    const response = await apiClient.get<PhoneEventsPaginatedResponse>(`/process/${importId}/events`, {
        params: {
            page,
        },
    })

    return response.data
}
