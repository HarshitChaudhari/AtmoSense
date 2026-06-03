import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export const useWorldMap = (refresh = false) =>
  useQuery({
    queryKey: ['worldMap', refresh],
    queryFn: async () => {
      const { data } = await api.get('/api/map/world', { params: { refresh } })
      return data
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })

export const useHealthRisk = () =>
  useQuery({
    queryKey: ['healthRisk'],
    queryFn: async () => {
      const { data } = await api.get('/api/map/health-risk')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })