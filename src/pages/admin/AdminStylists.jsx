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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

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

  async function addStylist() {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('stylists').insert({
      salon_id: salonId,
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      phone: form.phone.trim() || null,
      is_active: true,
    })
    setSaving(false)
    if (error) {
      toast.error('Error al agregar estilista')
      return
    }
    toast.success('✅ Estilista agregada')
    setModalOpen(false)
    setForm(EMPTY_FORM)
    fetchStylists()
  }

  async function toggleActive(stylist) {
    const { error } = await supabase
      .from('stylists')
      .update({ is_active: !stylist.is_active })
      .eq('id', stylist.id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(stylist.is_active ? 'Estilista desactivada' : 'Estilista activada')
    fetchStylists()
  }

  async function deleteStylist(id) {
    const { error } = await supabase.from('stylists').delete().eq('id', id)
    if (error) { toast.error('No se puede eliminar (tiene citas asociadas)'); return }
    toast.success('Estilista eliminada')
    setConfirmDelete(null)
    fetchStylists()
  }

  return (
    <AppShell
      title="Estilistas"
      actions={<Button size="sm" onClick={() => setModalOpen(true)}>+ Agregar</Button>}
    >
      <div className="px-4 py-5 space-y-3">
        {loading ? <Spinner /> : stylists.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">✂️</p>
            <p className="font-medium">Sin estilistas aún</p>
          </div>
        ) : (
          stylists.map((s) => (
            <Card key={s.id} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                {s.avatar_url
                  ? <img src={s.avatar_url} alt={s.name} className="w-full h-full rounded-full object-cover" />
                  : '✂️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brown">{s.name}</p>
                {s.specialty && (
                  <p className="text-xs text-gray-400 mt-0.5">{s.specialty}</p>
                )}
                {s.phone && (
                  <p className="text-xs text-primary font-medium mt-0.5">📱 {s.phone}</p>
                )}
                <Badge color={s.is_active ? 'green' : 'gray'} className="mt-1">
                  {s.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    s.is_active
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-primary-50 text-primary hover:bg-primary-100'
                  }`}
                >
                  {s.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(s)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM) }} title="Nueva estilista">
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
          <Button size="full" loading={saving} onClick={addStylist}>
            Agregar estilista
          </Button>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar estilista">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium">
            ¿Seguro que deseas eliminar a <strong>{confirmDelete?.name}</strong>?
            Si tiene citas asociadas no podrá eliminarse.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteStylist(confirmDelete.id)}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
