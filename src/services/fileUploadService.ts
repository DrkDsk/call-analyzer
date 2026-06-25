import apiClient from './apiClient'

export type PhoneEventsSummary = {
    total_events: number
    total_calls: number
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

export type AnalyzePhoneEventsResponse = {
    data: {
        import: ImportResult | null
        summary: PhoneEventsSummary
    }
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
