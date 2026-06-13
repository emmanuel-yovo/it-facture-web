import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Loader2, Plus, Shield, Trash2 } from 'lucide-react'
import { PERMISSIONS } from '@/lib/permissions'
import { useTranslation } from 'react-i18next'

export function RolesManager() {
  const { t } = useTranslation()
  const { workspaceId, user } = useAuthStore()
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // State for creating/editing role
  const [isEditing, setIsEditing] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  
  const allPermissions = Object.values(PERMISSIONS)

  useEffect(() => {
    loadRoles()
  }, [workspaceId])

  const loadRoles = async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          id, name, description, is_system,
          role_permissions (permission)
        `)
        .or(`workspace_id.eq.${workspaceId},is_system.eq.true`)
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      setRoles(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingRole({
      name: '',
      description: '',
      role_permissions: []
    })
    setIsEditing(true)
  }

  const handleEdit = (role: any) => {
    if (role.is_system) return // Should not be able to edit system roles easily from UI
    setEditingRole({
      ...role,
      role_permissions: role.role_permissions.map((rp: any) => rp.permission) // flatten
    })
    setIsEditing(true)
  }

  const handleTogglePermission = (permission: string) => {
    setEditingRole((prev: any) => {
      const current = prev.role_permissions || []
      if (current.includes(permission)) {
        return { ...prev, role_permissions: current.filter((p: string) => p !== permission) }
      } else {
        return { ...prev, role_permissions: [...current, permission] }
      }
    })
  }

  const handleSave = async () => {
    if (!editingRole.name.trim()) return alert("Le nom du rôle est obligatoire")
    
    setSaving(true)
    try {
      let roleId = editingRole.id

      if (roleId) {
        // Update existing role
        const { error: roleErr } = await supabase
          .from('roles')
          .update({ name: editingRole.name, description: editingRole.description })
          .eq('id', roleId)
          .eq('workspace_id', workspaceId)
        
        if (roleErr) throw roleErr

        // Delete old permissions
        await supabase.from('role_permissions').delete().eq('role_id', roleId)
      } else {
        // Create new role
        const { data: newRole, error: newRoleErr } = await supabase
          .from('roles')
          .insert({
            workspace_id: workspaceId,
            name: editingRole.name,
            description: editingRole.description
          })
          .select()
          .single()
        
        if (newRoleErr) throw newRoleErr
        roleId = newRole.id
      }

      // Insert new permissions
      if (editingRole.role_permissions.length > 0) {
        const permsToInsert = editingRole.role_permissions.map((p: string) => ({
          role_id: roleId,
          permission: p
        }))
        const { error: permErr } = await supabase.from('role_permissions').insert(permsToInsert)
        if (permErr) throw permErr
      }

      setIsEditing(false)
      loadRoles()
    } catch (err: any) {
      console.error(err)
      alert("Erreur lors de la sauvegarde: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return
    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId).eq('workspace_id', workspaceId)
      if (error) throw error
      loadRoles()
    } catch (err: any) {
      alert("Erreur: " + err.message)
    }
  }

  const formatPermissionName = (perm: string) => {
    return perm.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (isEditing && editingRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingRole.id ? 'Modifier le rôle' : 'Nouveau rôle personnalisé'}</CardTitle>
          <CardDescription>Définissez le nom et les accès précis de ce rôle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nom du Rôle</Label>
              <Input 
                value={editingRole.name} 
                onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                placeholder="ex: Commercial, Stagiaire..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnelle)</Label>
              <Input 
                value={editingRole.description || ''} 
                onChange={e => setEditingRole({...editingRole, description: e.target.value})}
                placeholder="Peut uniquement voir les factures..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Permissions accordées</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPermissions.map(permission => (
                <div key={permission} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox 
                    id={permission}
                    checked={editingRole.role_permissions.includes(permission)}
                    onCheckedChange={() => handleTogglePermission(permission)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor={permission} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      {formatPermissionName(permission)}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gestion des Rôles (RBAC)</h3>
          <p className="text-sm text-muted-foreground">Créez des rôles sur-mesure pour vos employés.</p>
        </div>
        <Button onClick={handleCreateNew}><Plus className="w-4 h-4 mr-2" /> Nouveau Rôle</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.id} className="relative group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center">
                  <Shield className={`w-4 h-4 mr-2 ${role.is_system ? 'text-primary' : 'text-blue-500'}`} />
                  {role.name}
                </CardTitle>
                {!role.is_system && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(role.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs h-8">
                {role.description || (role.is_system ? 'Rôle système par défaut' : 'Rôle personnalisé')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {role.is_system && role.name === 'superadmin' ? 'Toutes les permissions' : `${role.role_permissions?.length || 0} permission(s)`}
              </div>
              <Button 
                variant={role.is_system ? "secondary" : "outline"} 
                className="w-full" 
                onClick={() => handleEdit(role)}
                disabled={role.is_system}
              >
                {role.is_system ? 'Verrouillé (Système)' : 'Modifier les accès'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
