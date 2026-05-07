import { useEffect, useState, useCallback } from 'react'
import Modal from '../components/Modal'
import {
  listUserCategories, deactivateUserCategory,
  listDefaultTemplates, createDefaultTemplate, updateDefaultTemplate, deleteDefaultTemplate,
} from '../api/adminApi'

const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#A0522D','#6C5CE7','#00B894','#74B9FF','#FD79A8','#55EFC4','#FDCB6E','#E17055','#00CEC9','#B2BEC3']
const EMPTY_TPL = { group_name: '', group_sort_order: 0, name: '', type: 'expense', color: '', icon: '' }

// Danh sách icon Ionicons dùng trong mobile app, nhóm theo chủ đề
const ICON_GROUPS = [
  {
    group: 'Ăn uống & Đồ uống',
    icons: [
      { value: 'fast-food',   emoji: '🍔', label: 'Ăn uống' },
      { value: 'cafe',        emoji: '☕', label: 'Cafe & Trà' },
      { value: 'restaurant',  emoji: '🍽️', label: 'Nhà hàng' },
      { value: 'pizza',       emoji: '🍕', label: 'Pizza' },
      { value: 'beer',        emoji: '🍺', label: 'Bia & Rượu' },
      { value: 'ice-cream',   emoji: '🍦', label: 'Đồ ngọt' },
      { value: 'nutrition',   emoji: '🥗', label: 'Dinh dưỡng' },
    ],
  },
  {
    group: 'Nhà ở & Sinh hoạt',
    icons: [
      { value: 'home',        emoji: '🏠', label: 'Nhà ở' },
      { value: 'bed',         emoji: '🛏️', label: 'Phòng ngủ' },
      { value: 'water',       emoji: '💧', label: 'Nước sinh hoạt' },
      { value: 'bulb',        emoji: '💡', label: 'Điện' },
      { value: 'construct',   emoji: '🔧', label: 'Sửa chữa' },
      { value: 'tv',          emoji: '📺', label: 'TV & Internet' },
      { value: 'wifi',        emoji: '📶', label: 'Wifi' },
    ],
  },
  {
    group: 'Di chuyển & Phương tiện',
    icons: [
      { value: 'car',         emoji: '🚗', label: 'Ô tô' },
      { value: 'bus',         emoji: '🚌', label: 'Xe buýt' },
      { value: 'train',       emoji: '🚆', label: 'Tàu hỏa' },
      { value: 'airplane',    emoji: '✈️', label: 'Máy bay' },
      { value: 'bicycle',     emoji: '🚲', label: 'Xe đạp' },
      { value: 'boat',        emoji: '🚢', label: 'Tàu thuyền' },
      { value: 'navigate',    emoji: '🧭', label: 'Di chuyển' },
    ],
  },
  {
    group: 'Sức khỏe & Thể thao',
    icons: [
      { value: 'medical',     emoji: '🏥', label: 'Y tế' },
      { value: 'fitness',     emoji: '🏋️', label: 'Thể hình' },
      { value: 'football',    emoji: '⚽', label: 'Bóng đá' },
      { value: 'basketball',  emoji: '🏀', label: 'Bóng rổ' },
      { value: 'heart',       emoji: '❤️', label: 'Sức khỏe' },
      { value: 'bandage',     emoji: '🩹', label: 'Thuốc' },
      { value: 'body',        emoji: '🧘', label: 'Yoga & Thiền' },
    ],
  },
  {
    group: 'Mua sắm & Thời trang',
    icons: [
      { value: 'cart',        emoji: '🛒', label: 'Mua sắm' },
      { value: 'bag-handle',  emoji: '🛍️', label: 'Túi mua hàng' },
      { value: 'pricetag',    emoji: '🏷️', label: 'Khuyến mãi' },
      { value: 'shirt',       emoji: '👕', label: 'Quần áo' },
      { value: 'watch',       emoji: '⌚', label: 'Phụ kiện' },
      { value: 'diamond',     emoji: '💎', label: 'Trang sức' },
    ],
  },
  {
    group: 'Giải trí & Văn hóa',
    icons: [
      { value: 'film',        emoji: '🎬', label: 'Phim & TV' },
      { value: 'musical-notes',emoji: '🎵', label: 'Âm nhạc' },
      { value: 'game-controller',emoji:'🎮', label: 'Game' },
      { value: 'headset',     emoji: '🎧', label: 'Podcast' },
      { value: 'camera',      emoji: '📷', label: 'Nhiếp ảnh' },
      { value: 'book',        emoji: '📚', label: 'Sách' },
      { value: 'ticket',      emoji: '🎟️', label: 'Vé sự kiện' },
    ],
  },
  {
    group: 'Tài chính & Công việc',
    icons: [
      { value: 'cash',        emoji: '💵', label: 'Tiền mặt' },
      { value: 'card',        emoji: '💳', label: 'Thẻ ngân hàng' },
      { value: 'briefcase',   emoji: '💼', label: 'Công việc' },
      { value: 'trending-up', emoji: '📈', label: 'Đầu tư' },
      { value: 'trending-down',emoji:'📉', label: 'Chi phí' },
      { value: 'calculator',  emoji: '🧮', label: 'Tính toán' },
      { value: 'trophy',      emoji: '🏆', label: 'Thưởng' },
    ],
  },
  {
    group: 'Giáo dục & Phát triển',
    icons: [
      { value: 'school',      emoji: '🏫', label: 'Học phí' },
      { value: 'library',     emoji: '📖', label: 'Thư viện' },
      { value: 'rocket',      emoji: '🚀', label: 'Phát triển' },
      { value: 'laptop',      emoji: '💻', label: 'Laptop' },
      { value: 'phone-portrait',emoji:'📱', label: 'Điện thoại' },
      { value: 'desktop',     emoji: '🖥️', label: 'Máy tính' },
    ],
  },
  {
    group: 'Gia đình & Cá nhân',
    icons: [
      { value: 'people',      emoji: '👨‍👩‍👧', label: 'Gia đình' },
      { value: 'person',      emoji: '👤', label: 'Cá nhân' },
      { value: 'gift',        emoji: '🎁', label: 'Quà tặng' },
      { value: 'leaf',        emoji: '🌸', label: 'Hoa & Cây' },
      { value: 'paw',         emoji: '🐾', label: 'Thú cưng' },
      { value: 'umbrella',    emoji: '☂️', label: 'Bảo hiểm' },
      { value: 'shield',      emoji: '🛡️', label: 'An toàn' },
    ],
  },
  {
    group: 'Tiện ích & Khác',
    icons: [
      { value: 'settings',    emoji: '⚙️', label: 'Cài đặt' },
      { value: 'star',        emoji: '⭐', label: 'Yêu thích' },
      { value: 'flag',        emoji: '🚩', label: 'Mục tiêu' },
      { value: 'pin',         emoji: '📍', label: 'Địa điểm' },
      { value: 'mail',        emoji: '✉️', label: 'Bưu chính' },
      { value: 'call',        emoji: '📞', label: 'Điện thoại' },
      { value: 'ellipsis-horizontal', emoji: '•••', label: 'Khác' },
    ],
  },
]

// Map value → {emoji, label} để tra nhanh khi hiển thị
const ICON_MAP = Object.fromEntries(
  ICON_GROUPS.flatMap(g => g.icons.map(i => [i.value, i]))
)

function Badge({ children, color }) {
  const cls = { green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-600',
    blue:'bg-blue-100 text-blue-700', gray:'bg-slate-100 text-slate-500',
    purple:'bg-purple-100 text-purple-700' }[color] || 'bg-slate-100 text-slate-500'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>
}

// ── User Categories Tab ────────────────────────────────────────────────────────

function UserCategoriesTab() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)

  const load = useCallback(async (p = 1) => {
    const params = { page: p, page_size: 20 }
    if (userIdFilter) params.user_id = userIdFilter
    if (typeFilter) params.type = typeFilter
    if (includeInactive) params.include_inactive = true
    const d = await listUserCategories(params)
    setData(d); setPage(p)
  }, [userIdFilter, typeFilter, includeInactive])

  useEffect(() => { load(1) }, [userIdFilter, typeFilter, includeInactive])

  async function handleDeactivate(id, name) {
    if (!confirm(`Vô hiệu hóa danh mục "${name}"?`)) return
    try { await deactivateUserCategory(id); load(page) }
    catch (e) { alert(e.message) }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-sm">Danh mục của người dùng</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="text" placeholder="User ID" value={userIdFilter}
            onChange={e => setUserIdFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none w-24 focus:border-blue-400"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
            <option value="">Tất cả loại</option>
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
            Gồm đã ẩn
          </label>
        </div>
      </div>

      {!data ? <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div> : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Tên danh mục</th>
              <th className="px-4 py-3">Loại</th><th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Màu / Icon</th><th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(c => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-400">#{c.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <Badge color={c.type === 'expense' ? 'red' : 'green'}>
                    {c.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-slate-700">{c.user_full_name}</div>
                  <div className="text-xs text-slate-400">{c.user_email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border border-slate-200"
                      style={{ background: c.color || '#f1f5f9' }}
                    >
                      {c.icon && ICON_MAP[c.icon] ? ICON_MAP[c.icon].emoji : '•'}
                    </span>
                    {c.icon && (
                      <span className="text-xs text-slate-400">
                        {ICON_MAP[c.icon]?.label || c.icon}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.is_active ? <Badge color="green">Hoạt động</Badge> : <Badge color="gray">Đã ẩn</Badge>}
                </td>
                <td className="px-4 py-3">
                  {c.is_active && (
                    <button onClick={() => handleDeactivate(c.id, c.name)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      Ẩn
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
          <span>Tổng: {data.total}</span>
          <button disabled={page<=1} onClick={() => load(page-1)}
            className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">← Trước</button>
          <span>Trang {page}/{totalPages}</span>
          <button disabled={page>=totalPages} onClick={() => load(page+1)}
            className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Sau →</button>
        </div>
      )}
    </div>
  )
}

// ── Default Categories Tab ─────────────────────────────────────────────────────

function DefaultCategoriesTab() {
  const [templates, setTemplates] = useState(null)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [modal, setModal] = useState(null) // null | {mode:'create'} | {mode:'edit', tpl}
  const [form, setForm] = useState(EMPTY_TPL)
  const [formErr, setFormErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const d = await listDefaultTemplates(includeInactive ? { include_inactive: true } : {})
    setTemplates(d)
  }, [includeInactive])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY_TPL); setFormErr(''); setModal({ mode: 'create' }) }
  function openEdit(tpl) {
    setForm({ group_name: tpl.group_name, group_sort_order: tpl.group_sort_order,
      name: tpl.name, type: tpl.type, color: tpl.color || '', icon: tpl.icon || '' })
    setFormErr('')
    setModal({ mode: 'edit', tpl })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErr(''); setSubmitting(true)
    try {
      if (modal.mode === 'create') await createDefaultTemplate(form)
      else await updateDefaultTemplate(modal.tpl.id, form)
      setModal(null); load()
    } catch (e) { setFormErr(e.message) }
    finally { setSubmitting(false) }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa template danh mục mặc định "${name}"?`)) return
    try { await deleteDefaultTemplate(id); load() }
    catch (e) { alert(e.message) }
  }

  // Group templates by group_name
  const groups = templates ? templates.reduce((acc, t) => {
    if (!acc[t.group_name]) acc[t.group_name] = []
    acc[t.group_name].push(t)
    return acc
  }, {}) : {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
            Hiện cả đã xóa
          </label>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
          + Thêm danh mục mặc định
        </button>
      </div>

      {!templates ? <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div> : (
        Object.entries(groups).length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Chưa có danh mục mặc định</div>
        ) : (
          Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="font-semibold text-sm text-slate-700">{groupName}</span>
                <span className="ml-2 text-xs text-slate-400">({items.length} danh mục)</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-3">Tên</th><th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Màu / Icon</th><th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                      <td className="px-4 py-3">
                        <Badge color={t.type === 'expense' ? 'red' : 'green'}>
                          {t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border border-slate-200"
                            style={{ background: t.color || '#f1f5f9' }}
                          >
                            {t.icon && ICON_MAP[t.icon] ? ICON_MAP[t.icon].emoji : '•'}
                          </span>
                          {t.icon && (
                            <span className="text-xs text-slate-400">
                              {ICON_MAP[t.icon]?.label || t.icon}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {t.is_active ? <Badge color="green">Hoạt động</Badge> : <Badge color="gray">Đã xóa</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(t)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Sửa</button>
                          {t.is_active && (
                            <button onClick={() => handleDelete(t.id, t.name)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Xóa</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )
      )}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Thêm danh mục mặc định' : 'Sửa danh mục mặc định'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {formErr && <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2">{formErr}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tên nhóm</label>
            <input required value={form.group_name} onChange={e => setForm(f=>({...f,group_name:e.target.value}))}
              placeholder="Chi tiêu thiết yếu"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Thứ tự nhóm</label>
              <input type="number" value={form.group_sort_order} onChange={e => setForm(f=>({...f,group_sort_order:+e.target.value}))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Loại</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="expense">Chi tiêu</option>
                <option value="income">Thu nhập</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tên danh mục</label>
            <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder="Ăn uống"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Icon</label>
            <select
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="">— Chọn icon —</option>
              {ICON_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.icons.map(i => (
                    <option key={i.value} value={i.value}>
                      {i.emoji}  {i.label}  ({i.value})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {/* Preview icon đã chọn */}
            {form.icon && ICON_MAP[form.icon] && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: form.color || '#e2e8f0' }}
                >
                  {ICON_MAP[form.icon].emoji}
                </span>
                <div>
                  <div className="text-xs font-medium text-slate-700">{ICON_MAP[form.icon].label}</div>
                  <div className="text-xs text-slate-400">{form.icon}</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Màu sắc</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f=>({...f,color:c}))}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${form.color===c?'border-blue-500 scale-125':'border-transparent'}`}
                  style={{background:c}}/>
              ))}
            </div>
            {form.color && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-slate-200" style={{background:form.color}}/>
                <span className="text-xs text-slate-400">{form.color}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(null)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Đang lưu...' : modal?.mode === 'create' ? 'Tạo' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [tab, setTab] = useState('user')
  return (
    <div>
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Quản lý danh mục</h1>
      </div>
      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
          {[['user','Danh mục người dùng'],['default','Danh mục mặc định']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>{l}</button>
          ))}
        </div>
        {tab === 'user' ? <UserCategoriesTab /> : <DefaultCategoriesTab />}
      </div>
    </div>
  )
}
