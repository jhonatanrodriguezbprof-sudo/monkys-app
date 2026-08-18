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

const EMPTY_FORM = { name: '', duration_minutes: '', price: '' }

export default function AdminServices() {
  const { profile } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const salonId = SALON_ID || profile?.salon_id
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').eq('salon_id', salonId).order('price')
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
    setForm({ name: svc.name, duration_minutes: String(svc.duration_minutes), price: String(svc.price) })
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
      name: form.name,
      duration_minutes: parseInt(form.duration_minutes),
      price: parseFloat(form.price),
    }
    const { error } = editTarget
      ? await supabase.from('services').update(payload).eq('id', editTarget.id)
      : await supabase.from('services').insert(payload)

    setSaving(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success(editTarget ? 'Servicio actualizado' : 'Servicio creado')
    setModalOpen(false)
    fetchServices()
  }

  async function deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) { toast.error('No se puede eliminar (tiene citas asociadas)'); return }
    toast.success('Servicio eliminado')
    setConfirmDelete(null)
    fetchServices()
  }

  return (
    <AppShell
      title="Servicios"
      actions={
        <Button size="sm" onClick={openAdd}>+ Agregar</Button>
      }
    >
      <div className="px-4 py-5 space-y-3">
        {loading ? <Spinner /> : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💈</p>
            <p className="font-medium">Sin servicios aún</p>
          </div>
        ) : (
          services.map((svc) => (
            <Card key={svc.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brown">{svc.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">⏱ {svc.duration_minutes} min</span>
                  <span className="text-sm font-black text-primary">${svc.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(svc)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-50 text-primary hover:bg-primary-100 transition-colors text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setConfirmDelete(svc)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm"
                >
                  🗑️
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar servicio' : 'Nuevo servicio'}>
        <div className="space-y-4">
          <Input label="Nombre del servicio" placeholder="Ej. Corte infantil" value={form.name} onChange={(e) => setField('name', e.target.value)} icon="💈" />
          <Input label="Duración (minutos)" type="number" placeholder="Ej. 30" value={form.duration_minutes} onChange={(e) => setField('duration_minutes', e.target.value)} icon="⏱" />
          <Input label="Precio" type="number" placeholder="Ej. 25000" value={form.price} onChange={(e) => setField('price', e.target.value)} icon="💰" />
          <Button size="full" loading={saving} onClick={save}>
            {editTarget ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar servicio">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium">
            ¿Seguro que deseas eliminar <strong>{confirmDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteService(confirmDelete.id)}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
