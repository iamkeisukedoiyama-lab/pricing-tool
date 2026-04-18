'use client'
import * as XLSX from 'xlsx'

export interface SheetRow {
  [key: string]: string | number | null
}

export interface ParsedSheet {
  headers: string[]
  rows: SheetRow[]
  sheetNames: string[]
  activeSheet: string
}

export function parseExcelFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null })
        const headers = json.length > 0 ? Object.keys(json[0]) : []
        resolve({ headers, rows: json, sheetNames: workbook.SheetNames, activeSheet: sheetName })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function parseSheetByName(file: File, sheetName: string): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null })
        const headers = json.length > 0 ? Object.keys(json[0]) : []
        resolve({ headers, rows: json, sheetNames: workbook.SheetNames, activeSheet: sheetName })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export interface ColumnMapping {
  skuId: string
  productName: string
  variantName: string
  categoryName: string
  sellingPrice: string
  costPrice: string
}

export interface MergedRow {
  skuId: string
  productName: string
  variantName: string
  categoryName: string
  sellingPrice: number | null
  costPrice: number | null
}

function toNum(val: string | number | null): number | null {
  if (val === null || val === '') return null
  const n = Number(String(val).replace(/[,￥¥\s]/g, ''))
  return isNaN(n) ? null : n
}

function toStr(val: string | number | null): string {
  return val === null ? '' : String(val).trim()
}

export function mergeSheets(
  sellingRows: SheetRow[],
  sellingMap: ColumnMapping,
  costRows: SheetRow[] | null,
  costMap: ColumnMapping | null
): MergedRow[] {
  const costBySkuId = new Map<string, number | null>()
  if (costRows && costMap && costMap.skuId) {
    for (const row of costRows) {
      const id = toStr(row[costMap.skuId])
      if (id) costBySkuId.set(id, toNum(row[costMap.costPrice]))
    }
  }

  return sellingRows
    .map(row => {
      const skuId = toStr(row[sellingMap.skuId])
      const sellingPrice = sellingMap.sellingPrice ? toNum(row[sellingMap.sellingPrice]) : null
      const costFromSelling = sellingMap.costPrice ? toNum(row[sellingMap.costPrice]) : null
      const costFromCostSheet = costBySkuId.get(skuId) ?? null
      return {
        skuId,
        productName: toStr(row[sellingMap.productName]),
        variantName: toStr(row[sellingMap.variantName]),
        categoryName: toStr(row[sellingMap.categoryName]),
        sellingPrice,
        costPrice: costFromCostSheet ?? costFromSelling,
      }
    })
    .filter(r => r.skuId !== '')
}
