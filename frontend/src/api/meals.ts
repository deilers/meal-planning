import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Meal } from '../types'

export function useMeals(tag?: string) {
  return useQuery({
    queryKey: ['meals', tag],
    queryFn: async () => {
      const { data } = await api.get<Meal[]>('/meals', { params: tag ? { tag } : {} })
      return data
    },
  })
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: ['meal', id],
    queryFn: async () => {
      const { data } = await api.get<Meal>(`/meals/${id}`)
      return data
    },
  })
}

export function useCreateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (meal: Omit<Meal, 'id' | 'created_at'>) => {
      const { data } = await api.post<Meal>('/meals', meal)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}

export function useUpdateMeal(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Omit<Meal, 'id' | 'created_at'>>) => {
      const { data } = await api.put<Meal>(`/meals/${id}`, updates)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
      qc.invalidateQueries({ queryKey: ['meal', id] })
    },
  })
}

export function useDeleteMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/meals/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}
