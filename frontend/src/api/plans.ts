import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Plan } from '../types'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get<Plan[]>('/plans')
      return data
    },
  })
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: async () => {
      const { data } = await api.get<Plan>(`/plans/${id}`)
      return data
    },
  })
}

export function useGeneratePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { weeks: number; name: string }) => {
      const { data } = await api.post<Plan>('/plans/generate', params)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/plans/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}
