import { useState, useEffect } from 'react'
import { supabase, SALON_ID } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'

const EMPTY_FORM = { name: '', duration_minutes: '', price: '', categoria: '' }

const CAT_LABEL = { nina: '👧 Niña', nino: '👦 Niño', ambos: '👫 Ambos' }
const CAT_OPTIONS = [['nina', '👧 Niña'], ['nino', '👦 Niño'], ['ambos', '👫 Ambos']]

export default function AdminServices() {
  const { profile } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const salonId = SALON_ID || profile?.salon_id
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .order('price')
    setServices(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(svc) {
    setEditTarget(svc)
    setForm({ name: svc.name, duration_minutes: String(svc.duration_minutes), price: String(svc.price), categoria: svc.categoria || '' })
    setModalOpen(true)
  }

  async function save() {
    if (!form.name || !form.duration_minutes || !form.price) {
      toast.error('Completa todos los campos')
      return
    }
    setSaving(true)
    const payload = {
      salon_id: salonId,
      name: form.name.trim(),
      duration_minutes: parseInt(form.duration_minutes, 10),
      price: parseFloat(form.price),
      categoria: form.categoria || null,
    }
    const { error } = editTarget
      ? await supabase.from('services').update(payload).eq('id', editTarget.id)
      : await supabase.from('services').insert(payload)

    setSaving(false)
    if (error) { toast.error(error.message || 'Error al guardar'); return }
    toast.success(editTarget ? 'Servicio actualizado' : 'Servicio creado')
    setModalOpen(false)
    fetchServices()
  }

  async function toggleActive(svc) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !isActive(svc) })
      .eq('id', svc.id)
    if (error) { toast.error(error.message || 'Error al actualizar'); return }
    toast.success(isActive(svc) ? 'Servicio desactivado' : 'Servicio activado')
    fetchServices()
  }

  return (
    <AppShell
      title="Servicios"
      actions={<Button size="sm" onClick={openAdd}>+ Agregar</Button>}
    >
      <div className="px-4 py-5 space-y-3">
        {loading ? <Spinner /> : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💈</p>
            <p className="font-medium">Sin servicios aún</p>
          </div>
        ) : (
          services.map((svc) => (
            <Card key={svc.id} className={`flex items-center gap-3 ${!isActive(svc) ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brown">{svc.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">⏱ {svc.duration_minutes} min</span>
                  <span className="text-sm font-black text-primary">${svc.price.toLocaleString()}</span>
                  {svc.categoria && (
                    <Badge color="blue">{CAT_LABEL[svc.categoria]}</Badge>
                  )}
                  <Badge color={isActive(svc) ? 'green' : 'gray'}>
                    {isActive(svc) ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(svc)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-50 text-primary hover:bg-primary-100 transition-colors text-sm"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleActive(svc)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-sm ${
                    isActive(svc)
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={isActive(svc) ? 'Desactivar' : 'Activar'}
                >
                  {isActive(svc) ? '🚫' : '✅'}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar servicio' : 'Nuevo servicio'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del servicio"
            placeholder="Ej. Corte infantil"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            icon="💈"
          />
          <Input
            label="Duración (minutos)"
            type="number"
            placeholder="Ej. 30"
            value={form.duration_minutes}
            onChange={(e) => setField('duration_minutes', e.target.value)}
            icon="⏱"
          />
          <Input
            label="Precio"
            type="number"
            placeholder="Ej. 25000"
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
            icon="💰"
          />
          <div>
            <p className="text-sm font-semibold text-brown mb-2">Categoría</p>
            <div className="flex gap-2">
              {CAT_OPTIONS.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setField('categoria', form.categoria === val ? '' : val)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    form.categoria === val
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Button size="full" loading={saving} onClick={save}>
            {editTarget ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}

// is_active defaults to true for rows inserted before the column was added
function isActive(svc) {
  return svc.is_active !== false
}
