'use client'

import { useMemo, useState } from 'react'
import { Home, MailPlus, Shield, UserPlus, Users } from 'lucide-react'
import {
  createHousehold,
  createHouseholdInvite,
  joinHouseholdByCode,
  leaveHousehold,
  removeHouseholdMember,
  updateHouseholdMemberRole,
} from '@/lib/api'
import { useHouseholds } from '@/lib/hooks'
import { useAuth } from '@/components/auth-provider'
import { useRealtimeRefresh } from '@/contexts/RealtimeContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'

export default function HouseholdsPage() {
  const { user } = useAuth()
  const { data: households, error, isLoading, mutate } = useHouseholds()
  const { showToast } = useToast()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [processingKey, setProcessingKey] = useState<string | null>(null)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteForms, setInviteForms] = useState<Record<string, { email: string; role: 'member' | 'viewer' }>>({})

  useRealtimeRefresh(() => {
    void mutate()
  }, [mutate])

  const householdCount = households?.length || 0
  const memberCount = useMemo(
    () =>
      (households || []).reduce((sum, household) => sum + household.members.length, 0),
    [households],
  )

  const handleCreate = async () => {
    try {
      setCreating(true)
      await createHousehold({ name: newHouseholdName })
      setNewHouseholdName('')
      await mutate()
      showToast('Household olusturuldu.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Household olusturulamadi.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    try {
      setJoining(true)
      await joinHouseholdByCode({ code: inviteCode })
      setInviteCode('')
      await mutate()
      showToast('Davet kabul edildi.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Davet kabul edilemedi.', 'error')
    } finally {
      setJoining(false)
    }
  }

  const handleInvite = async (householdId: string) => {
    const form = inviteForms[householdId] || { email: '', role: 'member' as const }

    try {
      setProcessingKey(`invite-${householdId}`)
      await createHouseholdInvite(householdId, {
        email: form.email || undefined,
        role: form.role,
      })
      setInviteForms((current) => ({
        ...current,
        [householdId]: { email: '', role: 'member' },
      }))
      await mutate()
      showToast('Davet olusturuldu.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Davet olusturulamadi.', 'error')
    } finally {
      setProcessingKey(null)
    }
  }

  const handleRoleChange = async (
    householdId: string,
    memberId: string,
    role: 'admin' | 'member' | 'viewer',
  ) => {
    try {
      setProcessingKey(`role-${householdId}-${memberId}`)
      await updateHouseholdMemberRole(householdId, memberId, { role })
      await mutate()
      showToast('Rol guncellendi.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Rol guncellenemedi.', 'error')
    } finally {
      setProcessingKey(null)
    }
  }

  const handleRemoveMember = async (householdId: string, memberId: string) => {
    try {
      setProcessingKey(`remove-${householdId}-${memberId}`)
      await removeHouseholdMember(householdId, memberId)
      await mutate()
      showToast('Uye kaldirildi.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Uye kaldirilamadi.', 'error')
    } finally {
      setProcessingKey(null)
    }
  }

  const handleLeave = async (householdId: string) => {
    try {
      setProcessingKey(`leave-${householdId}`)
      await leaveHousehold(householdId)
      await mutate()
      showToast('Household ayrilma islemi tamamlandi.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Household ayrilma islemi basarisiz.', 'error')
    } finally {
      setProcessingKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        Household verileri yuklenemedi.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.1] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Users className="h-3.5 w-3.5" />
              Household Collaboration
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">
              Partner ve aile akislarini gorunur kil
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ortak household olustur, davet gonder, rol dagit ve partner hareketlerini transaction listesinde owner/reviewer bilgisiyle takip et.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Household</p>
              <p className="mt-2 text-2xl font-display font-semibold text-foreground">{householdCount}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam uye</p>
              <p className="mt-2 text-2xl font-display font-semibold text-foreground">{memberCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yeni household olustur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Household adi"
              value={newHouseholdName}
              onChange={(event) => setNewHouseholdName(event.target.value)}
              placeholder="Ortak butce, aile evi, partner hesabı..."
            />
            <Button onClick={() => void handleCreate()} loading={creating}>
              <Home className="mr-2 h-4 w-4" />
              Household olustur
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Davet kabul et</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Davet kodu"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Gonderilen invite code"
            />
            <Button onClick={() => void handleJoin()} loading={joining}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite kabul et
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {(households || []).length > 0 ? (households || []).map((household) => {
          const currentMembership = household.members.find((member) => member.userId === user?.id)
          const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin'
          const isOwner = currentMembership?.role === 'owner'
          const inviteForm = inviteForms[household.id] || { email: '', role: 'member' as const }

          return (
            <Card key={household.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>{household.name}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Rolun: <span className="font-semibold text-foreground">{currentMembership?.role || 'member'}</span>
                    </p>
                  </div>
                  {!isOwner && (
                    <Button
                      variant="outline"
                      loading={processingKey === `leave-${household.id}`}
                      onClick={() => void handleLeave(household.id)}
                    >
                      Household ayril
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {canManage && (
                  <div className="grid gap-4 rounded-[24px] border border-border/70 bg-background/75 p-4 md:grid-cols-[1.2fr_0.8fr_auto]">
                    <Input
                      label="Davet e-postasi"
                      value={inviteForm.email}
                      onChange={(event) =>
                        setInviteForms((current) => ({
                          ...current,
                          [household.id]: { ...inviteForm, email: event.target.value },
                        }))
                      }
                      placeholder="opsiyonel@ornek.com"
                    />
                    <Select
                      label="Rol"
                      value={inviteForm.role}
                      onChange={(event) =>
                        setInviteForms((current) => ({
                          ...current,
                          [household.id]: {
                            ...inviteForm,
                            role: event.target.value as 'member' | 'viewer',
                          },
                        }))
                      }
                      options={[
                        { value: 'member', label: 'Member' },
                        { value: 'viewer', label: 'Viewer' },
                      ]}
                    />
                    <div className="flex items-end">
                      <Button
                        loading={processingKey === `invite-${household.id}`}
                        onClick={() => void handleInvite(household.id)}
                      >
                        <MailPlus className="mr-2 h-4 w-4" />
                        Davet gonder
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Uyeler</p>
                    {household.members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-[20px] border border-border/70 bg-background/75 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {member.role}
                            </span>
                            {isOwner && member.role !== 'owner' && (
                              <Select
                                value={member.role}
                                onChange={(event) =>
                                  void handleRoleChange(
                                    household.id,
                                    member.userId,
                                    event.target.value as 'admin' | 'member' | 'viewer',
                                  )
                                }
                                options={[
                                  { value: 'admin', label: 'Admin' },
                                  { value: 'member', label: 'Member' },
                                  { value: 'viewer', label: 'Viewer' },
                                ]}
                              />
                            )}
                            {canManage && member.role !== 'owner' && (
                              <Button
                                variant="outline"
                                loading={processingKey === `remove-${household.id}-${member.userId}`}
                                onClick={() => void handleRemoveMember(household.id, member.userId)}
                              >
                                Kaldir
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Aktif davetler</p>
                    {household.invites && household.invites.length > 0 ? household.invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="rounded-[20px] border border-border/70 bg-background/75 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {invite.email || 'Genel davet'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Rol: {invite.role} · Kod: <span className="font-mono">{invite.code}</span>
                            </p>
                          </div>
                          <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                            {new Date(invite.expiresAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[20px] border border-dashed border-border/80 bg-background/50 p-4 text-sm text-muted-foreground">
                        Bu household icin acik invite bulunmuyor.
                      </div>
                    )}

                    <div className="rounded-[20px] border border-border/70 bg-warning/10 p-4 text-sm text-warning-foreground">
                      <p className="font-semibold">Rol matrix</p>
                      <p className="mt-2">Owner/Admin: davet, rol guncelleme ve uye yonetimi.</p>
                      <p className="mt-1">Member: katkı saglar, household verilerini gorur.</p>
                      <p className="mt-1">Viewer: salt okuma icin kullanilir.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Henuz household bulunmuyor. Yeni bir household olusturarak partner collaboration akisini acabilirsiniz.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
