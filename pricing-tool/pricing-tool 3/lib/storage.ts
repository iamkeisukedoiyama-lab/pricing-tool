'use client'
import { PricingStore } from './types'
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from './sampleData'

const KEY = 'raksul_pricing_v1'

export function loadStore(): PricingStore {
  if (typeof window === 'undefined') {
    return { categories: SAMPLE_CATEGORIES, products: SAMPLE_PRODUCTS, globalMarginRate: 30 }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { categories: SAMPLE_CATEGORIES, products: SAMPLE_PRODUCTS, globalMarginRate: 30 }
    return JSON.parse(raw) as PricingStore
  } catch {
    return { categories: SAMPLE_CATEGORIES, products: SAMPLE_PRODUCTS, globalMarginRate: 30 }
  }
}

export function saveStore(store: PricingStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function resetStore(): PricingStore {
  const fresh = { categories: SAMPLE_CATEGORIES, products: SAMPLE_PRODUCTS, globalMarginRate: 30 }
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(fresh))
  }
  return fresh
}
