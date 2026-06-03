import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export const useCityHistory = (city: string, days = 30) =>
  useQuery({
    queryKey: ['cityHistory', city, days],
    queryFn: async () => {
      const { data } = await api.get(`/api/city/${encodeURIComponent(city)}/history`, { params: { days } })
      return data
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  })

export const useCityForecast = (city: string, days = 7) =>
  useQuery({
    queryKey: ['cityForecast', city, days],
    queryFn: async () => {
      const { data } = await api.get(`/api/city/${encodeURIComponent(city)}/forecast`, { params: { days } })
      return data
    },
    enabled: !!city,
    staleTime: 10 * 60 * 1000,
  })

export const useCitySummary = (city: string) =>
  useQuery({
    queryKey: ['citySummary', city],
    queryFn: async () => {
      const { data } = await api.get(`/api/city/${encodeURIComponent(city)}/summary`)
      return data
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  })

export const useCityAnomalies = (city: string) =>
  useQuery({
    queryKey: ['cityAnomalies', city],
    queryFn: async () => {
      const { data } = await api.get(`/api/city/${encodeURIComponent(city)}/anomalies`)
      return data
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  })