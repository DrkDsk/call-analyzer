import apiClient from './apiClient'

export function uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/imports/phone-events/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
