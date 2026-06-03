import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export const useRadar = (cities: string[]) =>
  useQuery({
    queryKey: ['radar', cities],
    queryFn: async () => {
      const { data } = await api.get('/api/compare/radar', { params: { cities: cities.join(',') } })
      return data
    },
    enabled: cities.length >= 2,
    staleTime: 5 * 60 * 1000,
  })

export const useCorrelation = (cities: string[], days = 30) =>
  useQuery({
    queryKey: ['correlation', cities, days],
    queryFn: async () => {
      const { data } = await api.get('/api/compare/correlation', { params: { cities: cities.join(','), days } })
      return data
    },
    enabled: cities.length >= 2,
    staleTime: 5 * 60 * 1000,
  })