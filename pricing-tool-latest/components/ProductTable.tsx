'use client'
import { Product, SKU, CompetitorPrice, Category } from '@/lib/types'
import { analyzePrice, calcSellingPrice, calcMarginRate } from '@/lib/pricing'
import { DEFAULT_COMPETITORS } from '@/lib/sampleData'
import CompetitorModal from './CompetitorModal'
import { useState } from 'react'
import { Plus, Trash2, BarChart2 } from 'lucide-react'

interface Props {
  products: Product[]
  categories: Category[]
  selectedCategoryId: string | null
  globalMarginRate: number
  onUpdateSKU: (productId: string, skuId: string, patch: Partial<SKU>) => void
  onAddSKU: (productId: string) => void
  onDeleteSKU: (productId: string, skuId: string) => void
  onAddProduct: (categoryId: string) => void
  onDeleteProduct: (productId: string) => void
  onUpdateCompetitors: (productId: string, skuId: string, competitors: CompetitorPrice[]) => void
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-gray-300 text-xs">—</span>
  const abs = Math.abs(diff)
  const sign = diff > 0 ? '+' : ''
  if (Math.abs(diff) <= 5) {
    return <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{sign}{diff}%</span>
  }
  if (diff > 0) {
    return <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">+{abs}%</span>
  }
  return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{diff}%</span>
}

function SKURow({
  sku,
  globalMarginRate,
  onUpdate,
  onDelete,
  onEditCompetitors,
}: {
  sku: SKU
  globalMarginRate: number
  onUpdate: (patch: Partial<SKU>) => void
  onDelete: () => void
  onEditCompetitors: () => void
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const analysis = analyzePrice(sku)

  const handleCostChange = (val: string) => {
    const cost = Number(val)
    if (isNaN(cost) || cost < 0) return
    const selling = calcSellingPrice(cost, sku.marginRate)
    onUpdate({ costPrice: cost, sellingPrice: selling })
  }

  const handleSellingChange = (val: string) => {
    const selling = Number(val)
    if (isNaN(selling) || selling < 0) return
    const margin = calcMarginRate(sku.costPrice, selling)
    onUpdate({ sellingPrice: selling, marginRate: margin })
  }

  const handleMarginChange = (val: string) => {
    const margin = Number(val)
    if (isNaN(margin) || margin < 0 || margin >= 100) return
    const selling = calcSellingPrice(sku.costPrice, margin)
    onUpdate({ marginRate: margin, sellingPrice: selling })
  }

  const compCount = sku.competitors.filter(c => c.price !== null).length

  return (
    <tr className="border-b hover:bg-gray-50 group">
      <td className="px-3 py-2 text-xs text-gray-400 font-mono whitespace-nowrap">{sku.id}</td>
      <td className="px-3 py-2 text-sm">
        {editingCell === 'variant' ? (
          <input
            autoFocus
            defaultValue={sku.variantName}
            onBlur={e => { onUpdate({ variantName: e.target.value }); setEditingCell(null) }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="border rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        ) : (
          <span className="cursor-pointer hover:text-red-600" onClick={() => setEditingCell('variant')}>
            {sku.variantName}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editingCell === 'cost' ? (
          <input
            autoFocus
            type="number"
            defaultValue={sku.costPrice}
            onBlur={e => { handleCostChange(e.target.value); setEditingCell(null) }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="border rounded px-1.5 py-0.5 text-sm w-20 text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        ) : (
          <span className="cursor-pointer hover:text-red-600 text-sm" onClick={() => setEditingCell('cost')}>
            ¥{sku.costPrice.toLocaleString()}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editingCell === 'margin' ? (
          <input
            autoFocus
            type="number"
            defaultValue={sku.marginRate}
            step={0.1}
            onBlur={e => { handleMarginChange(e.target.value); setEditingCell(null) }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="border rounded px-1.5 py-0.5 text-sm w-16 text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        ) : (
          <span
            className={`cursor-pointer text-sm font-medium ${sku.marginRate >= 30 ? 'text-green-600' : 'text-orange-500'}`}
            onClick={() => setEditingCell('margin')}
          >
            {sku.marginRate}%
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editingCell === 'selling' ? (
          <input
            autoFocus
            type="number"
            defaultValue={sku.sellingPrice}
            onBlur={e => { handleSellingChange(e.target.value); setEditingCell(null) }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="border rounded px-1.5 py-0.5 text-sm w-24 text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        ) : (
          <span className="cursor-pointer hover:text-red-600 text-sm font-semibold" onClick={() => setEditingCell('selling')}>
            ¥{sku.sellingPrice.toLocaleString()}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right text-sm text-gray-500">
        {analysis.competitorAvg !== null ? `¥${analysis.competitorAvg.toLocaleString()}` : '—'}
      </td>
      <td className="px-3 py-2 text-center">
        <DiffBadge diff={analysis.diffPercent} />
      </td>
      <td className="px-3 py-2 text-sm text-gray-500 max-w-xs">
        <span className="line-clamp-1">{analysis.recommendation}</span>
        {analysis.recommendedPrice && (
          <span className="text-xs text-blue-600 ml-1">→ ¥{analysis.recommendedPrice.toLocaleString()}</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onEditCompetitors}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
        >
          <BarChart2 size={12} />
          {compCount > 0 ? `${compCount}件` : '入力'}
        </button>
      </td>
      <td className="px-3 py-2 text-center opacity-0 group-hover:opacity-100">
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

export default function ProductTable({
  products,
  categories,
  selectedCategoryId,
  globalMarginRate,
  onUpdateSKU,
  onAddSKU,
  onDeleteSKU,
  onAddProduct,
  onDeleteProduct,
  onUpdateCompetitors,
}: Props) {
  const [competitorModal, setCompetitorModal] = useState<{ productId: string; sku: SKU } | null>(null)

  const filtered = selectedCategoryId
    ? products.filter(p => p.categoryId === selectedCategoryId)
    : products

  const getCategoryPath = (catId: string): string => {
    const path: string[] = []
    let current: Category | undefined = categories.find(c => c.id === catId)
    while (current) {
      path.unshift(current.name)
      current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined
    }
    return path.join(' › ')
  }

  if (!selectedCategoryId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <BarChart2 size={40} className="mb-3 opacity-30" />
        <p className="text-sm">左のカテゴリーを選択してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>このカテゴリーには商品がありません</p>
        </div>
      )}

      {filtered.map(product => (
        <div key={product.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-mono border rounded px-1.5 py-0.5 bg-white">{product.id}</span>
              <span className="font-semibold text-gray-800">{product.name}</span>
              <span className="text-xs text-gray-400">{getCategoryPath(product.categoryId)}</span>
            </div>
            <button onClick={() => onDeleteProduct(product.id)} className="text-gray-300 hover:text-red-500 ml-4">
              <Trash2 size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b bg-gray-50/50">
                  <th className="px-3 py-2 text-left font-medium">SKU ID</th>
                  <th className="px-3 py-2 text-left font-medium">バリエーション</th>
                  <th className="px-3 py-2 text-right font-medium">原価</th>
                  <th className="px-3 py-2 text-right font-medium">利益率</th>
                  <th className="px-3 py-2 text-right font-medium">売価</th>
                  <th className="px-3 py-2 text-right font-medium">競合平均</th>
                  <th className="px-3 py-2 text-center font-medium">差分</th>
                  <th className="px-3 py-2 text-left font-medium">提案</th>
                  <th className="px-3 py-2 text-center font-medium">競合</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {product.skus.map(sku => (
                  <SKURow
                    key={sku.id}
                    sku={sku}
                    globalMarginRate={globalMarginRate}
                    onUpdate={patch => onUpdateSKU(product.id, sku.id, patch)}
                    onDelete={() => onDeleteSKU(product.id, sku.id)}
                    onEditCompetitors={() => setCompetitorModal({ productId: product.id, sku })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t bg-gray-50/50">
            <button
              onClick={() => onAddSKU(product.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
            >
              <Plus size={13} /> SKUを追加
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => onAddProduct(selectedCategoryId)}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-red-300 hover:text-red-500 flex items-center justify-center gap-2 text-sm transition-colors"
      >
        <Plus size={16} /> 商品を追加
      </button>

      {competitorModal && (
        <CompetitorModal
          sku={competitorModal.sku}
          onClose={() => setCompetitorModal(null)}
          onSave={competitors => onUpdateCompetitors(competitorModal.productId, competitorModal.sku.id, competitors)}
        />
      )}
    </div>
  )
}
