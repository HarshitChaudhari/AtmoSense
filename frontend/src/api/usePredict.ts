import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'

export interface PredictInput {
  aqi_value: number
  co_aqi_value?: number
  ozone_aqi_value?: number
  no2_aqi_value?: number
  pm25_aqi_value?: number
}

export const usePredict = () =>
  useMutation({
    mutationFn: async (input: PredictInput) => {
      const { data } = await api.post('/api/predict/', input)
      return data
    },
  })

export const useGlobalShap = () =>
  useQuery({
    queryKey: ['globalShap'],
    queryFn: async () => {
      const { data } = await api.get('/api/predict/shap/global')
      return data
    },
    staleTime: Infinity,
  })