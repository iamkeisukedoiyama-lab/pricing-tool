import { Category, Product } from './types'

export const DEFAULT_COMPETITORS = [
  { siteName: 'オリジナルプリント.jp', siteUrl: 'https://originalprint.jp', price: null },
  { siteName: 'ほしい！ノベルティ', siteUrl: 'https://hoshii-novelty.com', price: null },
  { siteName: '販促花子', siteUrl: 'https://hansoku-hanako.jp', price: null },
  { siteName: 'グラフィック', siteUrl: 'https://www.graphic.jp', price: null },
  { siteName: '名入れ製作所', siteUrl: 'https://www.naire-seisakusho.jp', price: null },
]

export const SAMPLE_CATEGORIES: Category[] = [
  // L1
  { id: 'bag', name: 'バッグ', parentId: null },
  { id: 'stationery', name: '文具', parentId: null },
  { id: 'apparel', name: 'アパレル', parentId: null },
  { id: 'food', name: '食品・ドリンク', parentId: null },
  // L2 - バッグ
  { id: 'eco-bag', name: 'エコバッグ', parentId: 'bag' },
  { id: 'shoulder', name: 'ショルダーバッグ', parentId: 'bag' },
  // L2 - 文具
  { id: 'notebook', name: 'ノート', parentId: 'stationery' },
  { id: 'pen', name: 'ペン', parentId: 'stationery' },
  // L2 - アパレル
  { id: 'tshirt', name: 'Tシャツ', parentId: 'apparel' },
  { id: 'polo', name: 'ポロシャツ', parentId: 'apparel' },
  // L2 - 食品
  { id: 'candy', name: 'お菓子', parentId: 'food' },
  // L3 - エコバッグ
  { id: 'tote', name: 'トートバッグ', parentId: 'eco-bag' },
  { id: 'shopping', name: 'ショッピングバッグ', parentId: 'eco-bag' },
  // L3 - ノート
  { id: 'ring-note', name: 'リングノート', parentId: 'notebook' },
  { id: 'pocket-note', name: 'ポケットノート', parentId: 'notebook' },
  // L3 - ペン
  { id: 'ballpen', name: 'ボールペン', parentId: 'pen' },
  { id: 'multipen', name: '多機能ペン', parentId: 'pen' },
  // L3 - Tシャツ
  { id: 'tshirt-short', name: '半袖Tシャツ', parentId: 'tshirt' },
  { id: 'tshirt-long', name: '長袖Tシャツ', parentId: 'tshirt' },
  // L3 - お菓子
  { id: 'gummy', name: 'グミ', parentId: 'candy' },
]

const mkComp = () => DEFAULT_COMPETITORS.map(c => ({ ...c }))

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'BAG-001',
    name: 'A4トートバッグ（スタンダード）',
    categoryId: 'tote',
    skus: [
      { id: 'BAG-001-WHT', productId: 'BAG-001', variantName: 'ホワイト', costPrice: 380, sellingPrice: 543, marginRate: 30, competitors: mkComp() },
      { id: 'BAG-001-NAV', productId: 'BAG-001', variantName: 'ネイビー', costPrice: 380, sellingPrice: 543, marginRate: 30, competitors: mkComp() },
      { id: 'BAG-001-BLK', productId: 'BAG-001', variantName: 'ブラック', costPrice: 380, sellingPrice: 543, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'BAG-002',
    name: 'マチ付きトートバッグ（大容量）',
    categoryId: 'tote',
    skus: [
      { id: 'BAG-002-NAT', productId: 'BAG-002', variantName: 'ナチュラル', costPrice: 520, sellingPrice: 743, marginRate: 30, competitors: mkComp() },
      { id: 'BAG-002-BEI', productId: 'BAG-002', variantName: 'ベージュ', costPrice: 520, sellingPrice: 743, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'BAG-003',
    name: 'ショッピングバッグ（折りたたみ）',
    categoryId: 'shopping',
    skus: [
      { id: 'BAG-003-S', productId: 'BAG-003', variantName: 'S / ホワイト', costPrice: 250, sellingPrice: 357, marginRate: 30, competitors: mkComp() },
      { id: 'BAG-003-M', productId: 'BAG-003', variantName: 'M / ホワイト', costPrice: 310, sellingPrice: 443, marginRate: 30, competitors: mkComp() },
      { id: 'BAG-003-L', productId: 'BAG-003', variantName: 'L / ホワイト', costPrice: 380, sellingPrice: 543, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'STN-001',
    name: 'リングノート A5（40枚）',
    categoryId: 'ring-note',
    skus: [
      { id: 'STN-001-WHT', productId: 'STN-001', variantName: 'ホワイト表紙', costPrice: 180, sellingPrice: 257, marginRate: 30, competitors: mkComp() },
      { id: 'STN-001-BLK', productId: 'STN-001', variantName: 'ブラック表紙', costPrice: 180, sellingPrice: 257, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'STN-002',
    name: 'ポケットノート B6（罫線）',
    categoryId: 'pocket-note',
    skus: [
      { id: 'STN-002-STD', productId: 'STN-002', variantName: 'スタンダード', costPrice: 150, sellingPrice: 214, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'STN-003',
    name: 'ノック式ボールペン（黒/0.7mm）',
    categoryId: 'ballpen',
    skus: [
      { id: 'STN-003-BLK', productId: 'STN-003', variantName: 'ブラック軸', costPrice: 80, sellingPrice: 114, marginRate: 30, competitors: mkComp() },
      { id: 'STN-003-WHT', productId: 'STN-003', variantName: 'ホワイト軸', costPrice: 80, sellingPrice: 114, marginRate: 30, competitors: mkComp() },
      { id: 'STN-003-RED', productId: 'STN-003', variantName: 'レッド軸', costPrice: 80, sellingPrice: 114, marginRate: 30, competitors: mkComp() },
    ],
  },
  {
    id: 'APR-001',
    name: '半袖Tシャツ（5.6oz）',
    categoryId: 'tshirt-short',
    skus: [
      { id: 'APR-001-S', productId: 'APR-001', variantName: 'ホワイト / S', costPrice: 650, sellingPrice: 929, marginRate: 30, competitors: mkComp() },
      { id: 'APR-001-M', productId: 'APR-001', variantName: 'ホワイト / M', costPrice: 650, sellingPrice: 929, marginRate: 30, competitors: mkComp() },
      { id: 'APR-001-L', productId: 'APR-001', variantName: 'ホワイト / L', costPrice: 650, sellingPrice: 929, marginRate: 30, competitors: mkComp() },
      { id: 'APR-001-XL', productId: 'APR-001', variantName: 'ホワイト / XL', costPrice: 700, sellingPrice: 1000, marginRate: 30, competitors: mkComp() },
    ],
  },
]
