'use client'
import { SKU, CompetitorPrice } from '@/lib/types'
import { X, ExternalLink } from 'lucide-react'
import { analyzePrice } from '@/lib/pricing'
import { useState } from 'react'

interface Props {
  sku: SKU
  onClose: () => void
  onSave: (competitors: CompetitorPrice[]) => void
}

export default function CompetitorModal({ sku, onClose, onSave }: Props) {
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>(
    sku.competitors.map(c => ({ ...c }))
  )

  const update = (index: number, field: keyof CompetitorPrice, value: string) => {
    setCompetitors(prev =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              [field]: field === 'price' ? (value === '' ? null : Number(value)) : value,
            }
          : c
      )
    )
  }

  const analysis = analyzePrice({ ...sku, competitors })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">競合価格設定</h2>
            <p className="text-sm text-gray-500 mt-0.5">{sku.id} — {sku.variantName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {competitors.map((comp, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={comp.siteName}
                  onChange={e => update(i, 'siteName', e.target.value)}
                  placeholder="サイト名"
                  className="w-full border rounded px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={comp.siteUrl}
                  onChange={e => update(i, 'siteUrl', e.target.value)}
                  placeholder="URL"
                  className="w-full border rounded px-2.5 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-sm">¥</span>
                <input
                  type="number"
                  value={comp.price ?? ''}
                  onChange={e => update(i, 'price', e.target.value)}
                  placeholder="価格"
                  min={0}
                  className="w-24 border rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              {comp.siteUrl && (
                <a href={comp.siteUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          ))}
        </div>

        {analysis.competitorAvg !== null && (
          <div className="mx-5 mb-4 p-3 bg-blue-50 rounded-lg text-sm space-y-1">
            <div className="flex gap-6 text-gray-700">
              <span>競合平均: <strong>¥{analysis.competitorAvg.toLocaleString()}</strong></span>
              <span>最安値: <strong>¥{analysis.competitorMin?.toLocaleString()}</strong></span>
              <span>最高値: <strong>¥{analysis.competitorMax?.toLocaleString()}</strong></span>
            </div>
            <p className={`font-medium ${
              analysis.diffPercent !== null && analysis.diffPercent > 5 ? 'text-red-600' :
              analysis.diffPercent !== null && analysis.diffPercent < -5 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {analysis.recommendation}
              {analysis.recommendedPrice && (
                <span className="ml-2 text-gray-500 font-normal">推奨売価: ¥{analysis.recommendedPrice.toLocaleString()}</span>
              )}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => { onSave(competitors); onClose() }}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}
