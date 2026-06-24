import apiClient from './apiClient'

export function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
