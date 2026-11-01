import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min for large uploads
})

// Request interceptor for logging
api.interceptors.request.use((config) => {
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Health check
export const checkHealth = () => api.get('/api/health')

// Projects
export const getProjects = () => api.get('/api/projects')
export const createProject = (data) => api.post('/api/projects', data)
export const getProject = (id) => api.get(`/api/projects/${id}`)
export const deleteProject = (id) => api.delete(`/api/projects/${id}`)

// Media upload
export const uploadMedia = (projectId, formData, onProgress) => {
  return api.post(`/api/projects/${projectId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
}

// Frame extraction
export const extractFrames = (projectId, data) =>
  api.post(`/api/projects/${projectId}/extract-frames`, data)

// Reconstruction
export const startReconstruction = (projectId, data) =>
  api.post(`/api/projects/${projectId}/reconstruct`, data)

// Status
export const getProjectStatus = (projectId) =>
  api.get(`/api/projects/${projectId}/status`)

// Model
export const getProjectModel = (projectId) =>
  api.get(`/api/projects/${projectId}/model`)

export default api
