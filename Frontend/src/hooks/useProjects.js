import { useState, useEffect, useCallback } from 'react'
import { getProjects, deleteProject, checkHealth } from '../services/api'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getProjects()
      setProjects(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load projects. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const removeProject = useCallback(async (id) => {
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete project')
      return false
    }
  }, [])

  return { projects, loading, error, refresh: fetchProjects, removeProject }
}

export function useBackendStatus() {
  const [status, setStatus] = useState('checking')
  const [info, setInfo] = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await checkHealth()
        setStatus('online')
        setInfo(res.data)
      } catch {
        setStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return { status, info }
}
