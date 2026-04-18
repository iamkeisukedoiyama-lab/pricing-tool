export interface Category {
  id: string
  name: string
  parentId: string | null
}

export interface CompetitorPrice {
  siteName: string
  siteUrl: string
  price: number | null
}

export interface SKU {
  id: string
  productId: string
  variantName: string
  costPrice: number
  sellingPrice: number
  marginRate: number
  competitors: CompetitorPrice[]
}

export interface Product {
  id: string
  name: string
  categoryId: string
  skus: SKU[]
}

export interface PricingStore {
  categories: Category[]
  products: Product[]
  globalMarginRate: number
}

export interface PriceAnalysis {
  competitorAvg: number | null
  competitorMin: number | null
  competitorMax: number | null
  diffPercent: number | null
  recommendation: string
  recommendedPrice: number | null
}
