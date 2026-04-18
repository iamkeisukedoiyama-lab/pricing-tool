'use client'
import { Category } from '@/lib/types'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface Props {
  categories: Category[]
  selectedCategoryId: string | null
  onSelect: (id: string) => void
}

interface TreeNode {
  category: Category
  children: TreeNode[]
}

function buildTree(categories: Category[]): TreeNode[] {
  const roots = categories.filter(c => c.parentId === null)
  const build = (parent: Category): TreeNode => ({
    category: parent,
    children: categories.filter(c => c.parentId === parent.id).map(build),
  })
  return roots.map(build)
}

function isAncestorOrSelf(node: TreeNode, selectedId: string | null): boolean {
  if (!selectedId) return false
  if (node.category.id === selectedId) return true
  return node.children.some(child => isAncestorOrSelf(child, selectedId))
}

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(() => isAncestorOrSelf(node, selectedId))
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.category.id
  const isLeaf = !hasChildren

  const handleClick = () => {
    if (hasChildren) setOpen(o => !o)
    if (isLeaf) onSelect(node.category.id)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1 px-2 py-1.5 rounded text-left text-sm transition-colors
          ${isSelected ? 'bg-red-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown size={14} className="shrink-0 opacity-60" />
          ) : (
            <ChevronRight size={14} className="shrink-0 opacity-60" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="truncate">{node.category.name}</span>
      </button>
      {open && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.category.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryNav({ categories, selectedCategoryId, onSelect }: Props) {
  const tree = buildTree(categories)
  return (
    <nav className="py-2">
      {tree.map(node => (
        <TreeItem
          key={node.category.id}
          node={node}
          depth={0}
          selectedId={selectedCategoryId}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}
