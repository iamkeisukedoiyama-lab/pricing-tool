'use client'
import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseExcelFile, mergeSheets, ColumnMapping, MergedRow, ParsedSheet } from '@/lib/importExcel'
import { DEFAULT_COMPETITORS } from '@/lib/sampleData'
import { Product, SKU, Category } from '@/lib/types'

interface Props {
  categories: Category[]
  onClose: () => void
  onImport: (products: Product[], categories: Category[]) => void
}

type Step = 'upload' | 'map-selling' | 'map-cost' | 'preview'

const NONE = '__none__'

function ColSelect({ label, value, headers, onChange, required }: {
  label: string; value: string; headers: string[]; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600 w-36 shrink-0">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <option value={NONE}>（マッピングしない）</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

function FileDropZone({ label, onFile, file }: { label: string; onFile: (f: File) => void; file: File | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center
        ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-green-700">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{file.name}</span>
        </div>
      ) : (
        <div className="text-gray-400">
          <FileSpreadsheet size={28} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs mt-1">クリックまたはドロップ (.xlsx / .csv)</p>
        </div>
      )}
    </div>
  )
}

function buildProducts(
  merged: MergedRow[],
  existingCategories: Category[],
  globalMarginRate: number
): { products: Product[]; newCategories: Category[] } {
  const catMap = new Map(existingCategories.map(c => [c.name, c]))
  const newCats: Category[] = []

  // Group by productName (or skuId prefix as fallback)
  const productMap = new Map<string, MergedRow[]>()
  for (const row of merged) {
    const key = row.productName || row.skuId
    const group = productMap.get(key) ?? []
    group.push(row)
    productMap.set(key, group)
  }

  const products: Product[] = []

  for (const [productName, rows] of Array.from(productMap.entries())) {
    const catName = rows[0].categoryName || '未分類'

    // Ensure category exists
    if (!catMap.has(catName)) {
      const newCat: Category = {
        id: `cat-${catName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
        name: catName,
        parentId: null,
      }
      catMap.set(catName, newCat)
      newCats.push(newCat)
    }

    const cat = catMap.get(catName) ?? { id: 'uncategorized', name: '未分類', parentId: null }
    const productId = rows[0].skuId.split('-').slice(0, 2).join('-') || `PROD-${Date.now()}`

    const skus: SKU[] = rows.map(row => {
      const cost = row.costPrice ?? 0
      const selling = row.sellingPrice ?? Math.ceil(cost / (1 - globalMarginRate / 100))
      const margin = selling > 0 ? Math.round(((selling - cost) / selling) * 1000) / 10 : globalMarginRate
      return {
        id: row.skuId,
        productId,
        variantName: row.variantName || row.skuId,
        costPrice: cost,
        sellingPrice: selling,
        marginRate: margin,
        competitors: DEFAULT_COMPETITORS.map(c => ({ ...c })),
      }
    })

    products.push({ id: productId, name: productName, categoryId: cat.id, skus })
  }

  return { products, newCategories: newCats }
}

export default function ImportModal({ categories, onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [sellingFile, setSellingFile] = useState<File | null>(null)
  const [costFile, setCostFile] = useState<File | null>(null)
  const [sellingSheet, setSellingSheet] = useState<ParsedSheet | null>(null)
  const [costSheet, setCostSheet] = useState<ParsedSheet | null>(null)
  const [sellingMap, setSellingMap] = useState<ColumnMapping>({
    skuId: NONE, productName: NONE, variantName: NONE, categoryName: NONE, sellingPrice: NONE, costPrice: NONE,
  })
  const [costMap, setCostMap] = useState<ColumnMapping>({
    skuId: NONE, productName: NONE, variantName: NONE, categoryName: NONE, sellingPrice: NONE, costPrice: NONE,
  })
  const [merged, setMerged] = useState<MergedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUploadNext = async () => {
    if (!sellingFile) { setError('売価シートは必須です'); return }
    setLoading(true); setError(null)
    try {
      const parsed = await parseExcelFile(sellingFile)
      setSellingSheet(parsed)
      // Auto-detect common column names
      const h = parsed.headers
      const find = (...candidates: string[]) =>
        candidates.find(c => h.some(hh => hh.toLowerCase().includes(c.toLowerCase()))) &&
        h.find(hh => candidates.some(c => hh.toLowerCase().includes(c.toLowerCase()))) || NONE
      setSellingMap({
        skuId: find('SKU', 'sku_id', 'id', 'コード', '品番', '商品コード'),
        productName: find('商品名', 'product', '名称', '商品'),
        variantName: find('バリエーション', 'variant', '色', 'カラー', 'サイズ', '種別'),
        categoryName: find('カテゴリ', 'category', '分類'),
        sellingPrice: find('売価', '販売価格', '売価格', 'selling', '定価'),
        costPrice: find('原価', 'cost', '仕入', '単価'),
      })
      if (costFile) {
        const costParsed = await parseExcelFile(costFile)
        setCostSheet(costParsed)
        setCostMap({
          skuId: find('SKU', 'sku_id', 'id', 'コード', '品番', '商品コード'),
          productName: NONE, variantName: NONE, categoryName: NONE, sellingPrice: NONE,
          costPrice: find('原価', 'cost', '仕入', '単価'),
        })
      }
      setStep('map-selling')
    } catch {
      setError('ファイルの読み込みに失敗しました。Excelファイルを確認してください。')
    }
    setLoading(false)
  }

  const handleMappingNext = () => {
    if (sellingMap.skuId === NONE) { setError('SKU IDの列は必須です'); return }
    setError(null)
    if (costFile && costSheet) { setStep('map-cost'); return }
    buildPreview()
  }

  const buildPreview = () => {
    if (!sellingSheet) return
    const result = mergeSheets(
      sellingSheet.rows,
      sellingMap,
      costSheet?.rows ?? null,
      costSheet ? costMap : null
    )
    setMerged(result)
    setStep('preview')
  }

  const handleImport = () => {
    const { products, newCategories } = buildProducts(merged, categories, 30)
    onImport(products, [...categories, ...newCategories])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">シートインポート</h2>
            <div className="flex items-center gap-1 mt-1">
              {(['upload', 'map-selling', 'map-cost', 'preview'] as Step[])
                .filter(s => s !== 'map-cost' || (costFile && costSheet))
                .map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${step === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {s === 'upload' ? 'ファイル' : s === 'map-selling' ? '売価マッピング' : s === 'map-cost' ? '原価マッピング' : 'プレビュー'}
                    </span>
                    {i < arr.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                  </span>
                ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">売価シート（必須）と原価シート（任意）をアップロードしてください。</p>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">売価シート <span className="text-red-500">*</span></p>
                <FileDropZone label="売価シートをアップロード" file={sellingFile} onFile={setSellingFile} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">原価シート（任意）</p>
                <FileDropZone label="原価シートをアップロード（省略可）" file={costFile} onFile={setCostFile} />
              </div>
            </div>
          )}

          {/* STEP 2: Map selling */}
          {step === 'map-selling' && sellingSheet && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
                <strong>{sellingSheet.activeSheet}</strong> — {sellingSheet.rows.length}行を検出しました。各列を対応する項目に設定してください。
              </div>
              <div className="space-y-3">
                <ColSelect label="SKU ID" value={sellingMap.skuId} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, skuId: v }))} required />
                <ColSelect label="商品名" value={sellingMap.productName} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, productName: v }))} />
                <ColSelect label="バリエーション名" value={sellingMap.variantName} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, variantName: v }))} />
                <ColSelect label="カテゴリー" value={sellingMap.categoryName} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, categoryName: v }))} />
                <ColSelect label="売価" value={sellingMap.sellingPrice} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, sellingPrice: v }))} />
                {!costFile && <ColSelect label="原価" value={sellingMap.costPrice} headers={sellingSheet.headers} onChange={v => setSellingMap(m => ({ ...m, costPrice: v }))} />}
              </div>
              {/* データプレビュー */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">データプレビュー（先頭3行）</p>
                <div className="overflow-x-auto border rounded-lg text-xs">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>{sellingSheet.headers.map(h => <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {sellingSheet.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t">
                          {sellingSheet.headers.map(h => <td key={h} className="px-2 py-1 text-gray-600 whitespace-nowrap max-w-[120px] truncate">{String(row[h] ?? '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Map cost */}
          {step === 'map-cost' && costSheet && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
                <strong>{costSheet.activeSheet}</strong> — {costSheet.rows.length}行を検出。SKU IDと原価の列を設定してください。
              </div>
              <div className="space-y-3">
                <ColSelect label="SKU ID" value={costMap.skuId} headers={costSheet.headers} onChange={v => setCostMap(m => ({ ...m, skuId: v }))} required />
                <ColSelect label="原価" value={costMap.costPrice} headers={costSheet.headers} onChange={v => setCostMap(m => ({ ...m, costPrice: v }))} />
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                <span><strong>{merged.length}件</strong>のSKUを読み込みました。インポートすると既存データに追加されます。</span>
              </div>
              <div className="overflow-x-auto border rounded-lg text-xs max-h-72">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['SKU ID', '商品名', 'バリエーション', 'カテゴリー', '原価', '売価'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merged.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono text-gray-400">{row.skuId}</td>
                        <td className="px-3 py-1.5 text-gray-700 max-w-[140px] truncate">{row.productName || '—'}</td>
                        <td className="px-3 py-1.5 text-gray-600">{row.variantName || '—'}</td>
                        <td className="px-3 py-1.5 text-gray-500">{row.categoryName || '—'}</td>
                        <td className="px-3 py-1.5 text-right">{row.costPrice !== null ? `¥${row.costPrice.toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-1.5 text-right font-semibold">{row.sellingPrice !== null ? `¥${row.sellingPrice.toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          <button
            onClick={() => {
              if (step === 'map-selling') setStep('upload')
              else if (step === 'map-cost') setStep('map-selling')
              else if (step === 'preview') setStep(costFile && costSheet ? 'map-cost' : 'map-selling')
              else onClose()
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            {step === 'upload' ? 'キャンセル' : '戻る'}
          </button>

          {step === 'upload' && (
            <button onClick={handleUploadNext} disabled={!sellingFile || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
              <Upload size={14} />
              {loading ? '読み込み中...' : '次へ'}
            </button>
          )}
          {step === 'map-selling' && (
            <button onClick={handleMappingNext}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              次へ
            </button>
          )}
          {step === 'map-cost' && (
            <button onClick={() => { setError(null); buildPreview() }}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              プレビュー
            </button>
          )}
          {step === 'preview' && (
            <button onClick={handleImport} disabled={merged.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
              <CheckCircle2 size={14} />
              {merged.length}件をインポート
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
