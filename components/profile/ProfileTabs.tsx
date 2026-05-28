'use client'

import { useState } from 'react'
import type { User } from '@prisma/client'
import type { PendingInvite } from '@/lib/types/admin'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { InviteForm } from '@/components/admin/InviteForm'
import { UserList } from '@/components/admin/UserList'
import { SessionHistoryTab } from '@/components/profile/SessionHistoryTab'

interface ProfileTabsProps {
  email: string
  role: string
  isAdmin: boolean
  currentUserId: string
  initialHourlyRate: number
  initialPayPeriodStart: number
  initialEmailSummary: boolean
  initialTimezone: string
  users: User[]
  pendingInvites: PendingInvite[]
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black px-4 py-2 border-b-[3px] border-black">
      <p className="text-xs font-bold uppercase tracking-widest text-white">{children}</p>
    </div>
  )
}

export function ProfileTabs({
  email,
  role,
  isAdmin,
  currentUserId,
  initialHourlyRate,
  initialPayPeriodStart,
  initialEmailSummary,
  initialTimezone,
  users,
  pendingInvites,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'admin'>('settings')

  return (
    <div className="border-[3px] border-black dark:border-zinc-700 shadow-brutal dark:bg-zinc-900">

      {/* Tab bar */}
      <div className="flex border-b-[3px] border-black">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-none border-r-[3px] border-black ${
            activeTab === 'settings'
              ? 'bg-black text-brutalist-yellow'
              : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-none ${
            isAdmin ? 'border-r-[3px] border-black' : ''
          } ${
            activeTab === 'history'
              ? 'bg-black text-brutalist-yellow'
              : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          History
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-none ${
              activeTab === 'admin'
                ? 'bg-black text-brutalist-yellow'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Admin
          </button>
        )}
      </div>

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div>
          <SectionLabel>Account</SectionLabel>
          <div className="px-6 py-5 border-b-[3px] border-black dark:border-zinc-700">
            <p className="text-sm font-bold dark:text-zinc-100">{email}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1">
              {role} · All data stored in UTC
            </p>
          </div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="px-6 py-6">
            <SettingsForm
              initialHourlyRate={initialHourlyRate}
              initialPayPeriodStart={initialPayPeriodStart}
              initialEmailSummary={initialEmailSummary}
              initialTimezone={initialTimezone}
            />
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && <SessionHistoryTab />}

      {/* Admin tab */}
      {activeTab === 'admin' && isAdmin && (
        <div>
          <SectionLabel>Invite User</SectionLabel>
          <div className="px-6 py-5 border-b-[3px] border-black">
            <InviteForm />
          </div>
          <UserList
            users={users}
            pendingInvites={pendingInvites}
            currentUserId={currentUserId}
          />
        </div>
      )}

    </div>
  )
}
