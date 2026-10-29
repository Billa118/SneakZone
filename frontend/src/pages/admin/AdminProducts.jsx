import { useEffect, useState } from 'react'
import { formatINR } from '../../config/brand'
import { adminApi } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'

const emptyForm = {
  name: '',
  brand: '',
  categoryId: '',
  description: '',
  price: '',
  originalPrice: '',
  imageUrl: '',
  colors: 'Black,White',
  gender: 'unisex',
  tags: 'new',
  sizes: '7,8,9,10',
  stock: '10',
}

export default function AdminProducts() {
  const { push } = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)

  const load = () => {
    adminApi.products().then((d) => setProducts(d.products)).catch((e) => push(e.message, 'error'))
    adminApi.categories().then((d) => setCategories(d.categories)).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const sizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const colors = form.colors.split(',').map((c) => c.trim()).filter(Boolean)
    const variants = []
    sizes.forEach((size) => {
      colors.forEach((color) => {
        variants.push({ size, color, stock: Number(form.stock) || 0 })
      })
    })
    const payload = {
      name: form.name,
      brand: form.brand,
      categoryId: Number(form.categoryId),
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      imageUrl: form.imageUrl,
      colors,
      gender: form.gender,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      variants,
      isDemo: true,
    }
    try {
      if (editing) {
        await adminApi.updateProduct(editing, {
          ...payload,
          variants: undefined,
        })
        push('Product updated')
      } else {
        await adminApi.createProduct(payload)
        push('Product created')
      }
      setForm(emptyForm)
      setEditing(null)
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const deactivate = async (id) => {
    try {
      await adminApi.deleteProduct(id)
      push('Product deactivated')
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Products</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{editing ? `Edit #${editing}` : 'Add product'}</h2>
        {['name', 'brand', 'imageUrl', 'description', 'price', 'originalPrice', 'colors', 'tags', 'sizes', 'stock'].map((key) => (
          <input
            key={key}
            className="rounded-lg border border-line px-3 py-2 text-sm"
            placeholder={key}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required={['name', 'brand', 'imageUrl', 'description', 'price'].includes(key)}
          />
        ))}
        <select
          className="rounded-lg border border-line px-3 py-2 text-sm"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          required
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-line px-3 py-2 text-sm"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        >
          <option value="men">men</option>
          <option value="women">women</option>
          <option value="kids">kids</option>
          <option value="unisex">unisex</option>
        </select>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(emptyForm) }}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-ink-muted">
                {p.brand} · {formatINR(p.price)} · {p.isActive ? 'active' : 'inactive'} · stock {p.stock}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="font-semibold text-accent"
                onClick={() => {
                  setEditing(p.id)
                  setForm({
                    name: p.name,
                    brand: p.brand,
                    categoryId: String(p.category?.id || ''),
                    description: p.description || '',
                    price: String(p.price),
                    originalPrice: p.originalPrice ? String(p.originalPrice) : '',
                    imageUrl: p.imageUrl,
                    colors: (p.colors || []).join(','),
                    gender: p.gender || 'unisex',
                    tags: (p.tags || []).join(','),
                    sizes: (p.variants || []).map((v) => v.size).filter((v, i, a) => a.indexOf(v) === i).join(','),
                    stock: '10',
                  })
                }}
              >
                Edit
              </button>
              {p.isActive && (
                <button type="button" className="font-semibold text-danger" onClick={() => deactivate(p.id)}>
                  Deactivate
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
