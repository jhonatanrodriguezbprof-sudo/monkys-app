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

const EMPTY_FORM = { name: '', specialty: '', phone: '' }

export default function AdminStylists() {
  const { profile } = useAuth()
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const salonId = SALON_ID || profile?.salon_id
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  useEffect(() => { fetchStylists() }, [])

  async function fetchStylists() {
    setLoading(true)
    const { data } = await supabase
      .from('stylists')
      .select('*')
      .eq('salon_id', salonId)
      .order('name')
    setStylists(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(stylist) {
    setEditTarget(stylist)
    setForm({ name: stylist.name, specialty: stylist.specialty || '', phone: stylist.phone || '' })
    setModalOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      phone: form.phone.trim() || null,
    }
    const { error } = editTarget
      ? await supabase.from('stylists').update(payload).eq('id', editTarget.id)
      : await supabase.from('stylists').insert({ ...payload, salon_id: salonId, is_active: true })

    setSaving(false)
    if (error) { toast.error(error.message || 'Error al guardar'); return }
    toast.success(editTarget ? 'Estilista actualizada' : '✅ Estilista agregada')
    setModalOpen(false)
    setForm(EMPTY_FORM)
    fetchStylists()
  }

  async function toggleActive(stylist) {
    const { error } = await supabase
      .from('stylists')
      .update({ is_active: !stylist.is_active })
      .eq('id', stylist.id)
    if (error) { toast.error(error.message || 'Error al actualizar'); return }
    toast.success(stylist.is_active ? 'Estilista desactivada' : 'Estilista activada')
    fetchStylists()
  }

  return (
    <AppShell
      title="Estilistas"
      actions={<Button size="sm" onClick={openAdd}>+ Agregar</Button>}
    >
      <div className="px-4 py-5 space-y-3">
        {loading ? <Spinner /> : stylists.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">✂️</p>
            <p className="font-medium">Sin estilistas aún</p>
          </div>
        ) : (
          stylists.map((s) => (
            <Card key={s.id} className={`flex items-center gap-4 ${!s.is_active ? 'opacity-60' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                {s.avatar_url
                  ? <img src={s.avatar_url} alt={s.name} className="w-full h-full rounded-full object-cover" />
                  : '✂️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brown">{s.name}</p>
                {s.specialty && <p className="text-xs text-gray-400 mt-0.5">{s.specialty}</p>}
                {s.phone && <p className="text-xs text-primary font-medium mt-0.5">📱 {s.phone}</p>}
                <Badge color={s.is_active ? 'green' : 'gray'} className="mt-1">
                  {s.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => openEdit(s)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary-50 text-primary hover:bg-primary-100 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    s.is_active
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {s.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY_FORM) }}
        title={editTarget ? 'Editar estilista' : 'Nueva estilista'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre completo *"
            placeholder="Ej. Laura Martínez"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            icon="✂️"
          />
          <Input
            label="Especialidad (opcional)"
            placeholder="Ej. Cortes infantiles, Trenzas"
            value={form.specialty}
            onChange={(e) => setField('specialty', e.target.value)}
            icon="⭐"
          />
          <Input
            label="Teléfono (opcional)"
            placeholder="Ej. 3001234567"
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            icon="📱"
          />
          <Button size="full" loading={saving} onClick={save}>
            {editTarget ? 'Guardar cambios' : 'Agregar estilista'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
