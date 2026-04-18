import { SKU, PriceAnalysis } from './types'

export function calcSellingPrice(costPrice: number, marginRate: number): number {
  if (marginRate >= 100) return costPrice
  return Math.ceil(costPrice / (1 - marginRate / 100))
}

export function calcMarginRate(costPrice: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0
  return Math.round(((sellingPrice - costPrice) / sellingPrice) * 1000) / 10
}

export function analyzePrice(sku: SKU): PriceAnalysis {
  const validPrices = sku.competitors
    .map(c => c.price)
    .filter((p): p is number => p !== null && p > 0)

  if (validPrices.length === 0) {
    return {
      competitorAvg: null,
      competitorMin: null,
      competitorMax: null,
      diffPercent: null,
      recommendation: '競合価格を入力してください',
      recommendedPrice: null,
    }
  }

  const avg = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
  const min = Math.min(...validPrices)
  const max = Math.max(...validPrices)
  const diff = Math.round(((sku.sellingPrice - avg) / avg) * 1000) / 10

  let recommendation = ''
  let recommendedPrice: number | null = null

  if (diff > 10) {
    recommendation = `競合平均より${diff}%高い。値下げを検討してください。`
    recommendedPrice = Math.ceil(avg * 1.05)
  } else if (diff > 5) {
    recommendation = `競合平均より${diff}%高め。`
    recommendedPrice = Math.ceil(avg * 1.03)
  } else if (diff < -10) {
    recommendation = `競合平均より${Math.abs(diff)}%安い。値上げ余地があります。`
    recommendedPrice = Math.ceil(avg * 0.95)
  } else if (diff < -5) {
    recommendation = `競合平均より${Math.abs(diff)}%安め。`
    recommendedPrice = Math.ceil(avg * 0.97)
  } else {
    recommendation = '競合平均と適切な価格差です。'
    recommendedPrice = null
  }

  return { competitorAvg: avg, competitorMin: min, competitorMax: max, diffPercent: diff, recommendation, recommendedPrice }
}

export function exportCSV(products: import('./types').Product[], categories: import('./types').Category[]): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]))

  const rows = [
    ['商品ID', '商品名', 'カテゴリー', 'SKU ID', 'バリエーション', '原価', '利益率(%)', '売価', '競合1', '競合2', '競合3', '競合4', '競合5', '競合平均', '競合差分(%)'],
  ]

  for (const product of products) {
    for (const sku of product.skus) {
      const { competitorAvg, diffPercent } = analyzePrice(sku)
      const compPrices = sku.competitors.map(c => c.price !== null ? String(c.price) : '')
      rows.push([
        product.id,
        product.name,
        catMap.get(product.categoryId) ?? '',
        sku.id,
        sku.variantName,
        String(sku.costPrice),
        String(sku.marginRate),
        String(sku.sellingPrice),
        ...compPrices,
        competitorAvg !== null ? String(competitorAvg) : '',
        diffPercent !== null ? String(diffPercent) : '',
      ])
    }
  }

  return rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}
