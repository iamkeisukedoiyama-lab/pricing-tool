'use client'
import { useState, useEffect, useCallback } from 'react'
import CategoryNav from '@/components/CategoryNav'
import ProductTable from '@/components/ProductTable'
import ImportModal from '@/components/ImportModal'
import { loadStore, saveStore, resetStore } from '@/lib/storage'
import { PricingStore, SKU, CompetitorPrice, Product, Category } from '@/lib/types'
import { calcSellingPrice, exportCSV, analyzePrice } from '@/lib/pricing'
import { DEFAULT_COMPETITORS } from '@/lib/sampleData'
import { Download, RefreshCw, Settings, Upload, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function CompetitorSummary({ products }: { products: Product[] }) {
  const allSkus = products.flatMap(p => p.skus)
  const analyzed = allSkus.map(analyzePrice)
  const withData = analyzed.filter(a => a.diffPercent !== null)
  if (withData.length === 0) return null

  const overpriced = withData.filter(a => (a.diffPercent ?? 0) > 5).length
  const underpriced = withData.filter(a => (a.diffPercent ?? 0) < -5).length
  const optimal = withData.length - overpriced - underpriced
  const avgDiff = withData.reduce((s, a) => s + (a.diffPercent ?? 0), 0) / withData.length

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">競合比較</span>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
          <TrendingUp size={11} /> 割高 {overpriced}
        </span>
        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
          <Minus size={11} /> 適正 {optimal}
        </span>
        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
          <TrendingDown size={11} /> 割安 {underpriced}
        </span>
      </div>
      <span className={`text-xs font-semibold ${avgDiff > 3 ? 'text-red-500' : avgDiff < -3 ? 'text-blue-500' : 'text-green-600'}`}>
        平均差分 {avgDiff > 0 ? '+' : ''}{avgDiff.toFixed(1)}%
      </span>
    </div>
  )
}

export default function Home() {
  const [store, setStore] = useState<PricingStore | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [marginInput, setMarginInput] = useState<string>('30')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    const s = loadStore()
    setStore(s)
    setMarginInput(String(s.globalMarginRate))
  }, [])

  const update = useCallback((updater: (prev: PricingStore) => PricingStore) => {
    setStore(prev => {
      if (!prev) return prev
      const next = updater(prev)
      saveStore(next)
      return next
    })
  }, [])

  const handleUpdateSKU = (productId: string, skuId: string, patch: Partial<SKU>) => {
    update(s => ({
      ...s,
      products: s.products.map(p =>
        p.id !== productId ? p : {
          ...p,
          skus: p.skus.map(sk => sk.id !== skuId ? sk : { ...sk, ...patch }),
        }
      ),
    }))
  }

  const handleAddSKU = (productId: string) => {
    update(s => {
      const product = s.products.find(p => p.id === productId)
      if (!product) return s
      const skuNum = product.skus.length + 1
      const newSku: SKU = {
        id: `${productId}-SKU${String(skuNum).padStart(2, '0')}`,
        productId,
        variantName: `バリエーション${skuNum}`,
        costPrice: 0,
        sellingPrice: 0,
        marginRate: s.globalMarginRate,
        competitors: DEFAULT_COMPETITORS.map(c => ({ ...c })),
      }
      return {
        ...s,
        products: s.products.map(p =>
          p.id !== productId ? p : { ...p, skus: [...p.skus, newSku] }
        ),
      }
    })
  }

  const handleDeleteSKU = (productId: string, skuId: string) => {
    update(s => ({
      ...s,
      products: s.products.map(p =>
        p.id !== productId ? p : { ...p, skus: p.skus.filter(sk => sk.id !== skuId) }
      ),
    }))
  }

  const handleAddProduct = (categoryId: string) => {
    update(s => {
      const id = `PROD-${Date.now()}`
      return {
        ...s,
        products: [
          ...s.products,
          {
            id,
            name: '新規商品',
            categoryId,
            skus: [
              {
                id: `${id}-SKU01`,
                productId: id,
                variantName: 'バリエーション1',
                costPrice: 0,
                sellingPrice: 0,
                marginRate: s.globalMarginRate,
                competitors: DEFAULT_COMPETITORS.map(c => ({ ...c })),
              },
            ],
          },
        ],
      }
    })
  }

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('この商品を削除しますか？')) return
    update(s => ({ ...s, products: s.products.filter(p => p.id !== productId) }))
  }

  const handleUpdateCompetitors = (productId: string, skuId: string, competitors: CompetitorPrice[]) => {
    handleUpdateSKU(productId, skuId, { competitors })
  }

  const handleGlobalMarginChange = () => {
    const rate = parseFloat(marginInput)
    if (isNaN(rate) || rate < 0 || rate >= 100) return
    update(s => ({
      ...s,
      globalMarginRate: rate,
      products: s.products.map(p => ({
        ...p,
        skus: p.skus.map(sk => ({
          ...sk,
          marginRate: rate,
          sellingPrice: calcSellingPrice(sk.costPrice, rate),
        })),
      })),
    }))
  }

  const handleExportCSV = () => {
    if (!store) return
    const csv = exportCSV(store.products, store.categories)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raksul_pricing_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (!confirm('サンプルデータにリセットします。現在のデータは削除されます。')) return
    const fresh = resetStore()
    setStore(fresh)
    setMarginInput(String(fresh.globalMarginRate))
    setSelectedCategoryId(null)
  }

  const handleImport = (importedProducts: Product[], mergedCategories: Category[]) => {
    update(s => {
      // Merge: replace existing products with same ID, append new ones
      const existingIds = new Set(s.products.map(p => p.id))
      const newProducts = importedProducts.filter(p => !existingIds.has(p.id))
      const updatedProducts = s.products.map(p => {
        const imported = importedProducts.find(ip => ip.id === p.id)
        return imported ?? p
      })
      return {
        ...s,
        categories: mergedCategories,
        products: [...updatedProducts, ...newProducts],
      }
    })
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        読み込み中...
      </div>
    )
  }

  const selectedCatName = selectedCategoryId
    ? store.categories.find(c => c.id === selectedCategoryId)?.name
    : null

  const filteredProducts = selectedCategoryId
    ? store.products.filter(p => p.categoryId === selectedCategoryId)
    : []

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">Raksul Novelty</h1>
            <p className="text-xs text-gray-400 leading-tight">売価設定ツール</p>
          </div>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <CompetitorSummary products={store.products} />
        </div>

        <div className="flex items-center gap-3">
          {/* Global Margin Setting */}
          <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5">
            <Settings size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">デフォルト利益率</span>
            <input
              type="number"
              value={marginInput}
              onChange={e => setMarginInput(e.target.value)}
              onBlur={handleGlobalMarginChange}
              onKeyDown={e => { if (e.key === 'Enter') handleGlobalMarginChange() }}
              step={0.1}
              min={0}
              max={99}
              className="w-14 text-right text-sm font-semibold border-0 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 font-medium"
          >
            <Upload size={14} />
            シートインポート
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            <Download size={14} />
            CSV出力
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
            title="サンプルデータにリセット"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r overflow-y-auto scrollbar-thin">
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">カテゴリー</p>
            <p className="text-xs text-gray-300 px-1 mt-0.5">{store.products.length} 商品</p>
          </div>
          <CategoryNav
            categories={store.categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-5 pt-4 pb-2 sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 border-b">
            <div className="flex items-center justify-between">
              <div>
                {selectedCatName ? (
                  <>
                    <h2 className="font-bold text-gray-900">{selectedCatName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{filteredProducts.length}件の商品 / {filteredProducts.reduce((s, p) => s + p.skus.length, 0)} SKU</p>
                  </>
                ) : (
                  <div>
                    <h2 className="font-bold text-gray-400">カテゴリーを選択してください</h2>
                    <p className="text-xs text-gray-300 mt-0.5">左のツリーからカテゴリーを選択すると商品が表示されます</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <ProductTable
              products={store.products}
              categories={store.categories}
              selectedCategoryId={selectedCategoryId}
              globalMarginRate={store.globalMarginRate}
              onUpdateSKU={handleUpdateSKU}
              onAddSKU={handleAddSKU}
              onDeleteSKU={handleDeleteSKU}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateCompetitors={handleUpdateCompetitors}
            />
          </div>
        </main>
      </div>

      {showImport && (
        <ImportModal
          categories={store.categories}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}
