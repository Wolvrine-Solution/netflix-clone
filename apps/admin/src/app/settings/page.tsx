'use client'
import React, { useState } from 'react'
import { FiGlobe, FiShield, FiMail, FiVideo, FiSave, FiCheckCircle } from 'react-icons/fi'

interface SettingsSection {
  id: string; title: string; icon: React.ReactNode; fields: SettingsField[]
}
interface SettingsField {
  key: string; label: string; type: 'text' | 'toggle' | 'select' | 'number'
  options?: string[]; placeholder?: string; description?: string
}

const SECTIONS: SettingsSection[] = [
  {
    id: 'platform',
    title: 'Platform',
    icon: <FiGlobe />,
    fields: [
      { key: 'platformName', label: 'Platform Name', type: 'text', placeholder: 'Netflix Clone' },
      { key: 'platformUrl', label: 'Platform URL', type: 'text', placeholder: 'https://yourstreaming.com' },
      { key: 'defaultLanguage', label: 'Default Language', type: 'select', options: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ko'] },
      { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle', description: 'Show maintenance page to non-admin users' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    icon: <FiVideo />,
    fields: [
      { key: 'maxProfilesPerAccount', label: 'Max Profiles per Account', type: 'number', placeholder: '5' },
      { key: 'enableDownloads', label: 'Enable Downloads', type: 'toggle', description: 'Allow users to download content for offline viewing' },
      { key: 'defaultVideoQuality', label: 'Default Video Quality', type: 'select', options: ['AUTO', '1080P', '720P', '480P'] },
      { key: 'enableContinueWatching', label: 'Continue Watching Row', type: 'toggle', description: 'Show resume progress row on browse page' },
      { key: 'tmdbApiEnabled', label: 'TMDB Integration', type: 'toggle', description: 'Enable TMDB import and live search' },
    ],
  },
  {
    id: 'auth',
    title: 'Auth & Security',
    icon: <FiShield />,
    fields: [
      { key: 'allowRegistration', label: 'Allow New Registrations', type: 'toggle', description: 'Allow users to create new accounts' },
      { key: 'requireEmailVerification', label: 'Require Email Verification', type: 'toggle', description: 'Users must verify email before watching' },
      { key: 'allowGoogleOAuth', label: 'Google Sign-In', type: 'toggle', description: 'Enable Google OAuth login' },
      { key: 'allowGithubOAuth', label: 'GitHub Sign-In', type: 'toggle', description: 'Enable GitHub OAuth login' },
      { key: 'sessionDurationDays', label: 'Session Duration (days)', type: 'number', placeholder: '30' },
    ],
  },
  {
    id: 'email',
    title: 'Email',
    icon: <FiMail />,
    fields: [
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'noreply@yourstreaming.com' },
      { key: 'emailWelcome', label: 'Welcome Email', type: 'toggle', description: 'Send welcome email on registration' },
      { key: 'emailNewsletterDefault', label: 'Subscribe to Newsletter by Default', type: 'toggle' },
    ],
  },
]

type SettingsState = Record<string, string | boolean | number>

const DEFAULTS: SettingsState = {
  platformName: 'Netflix Clone', platformUrl: '', defaultLanguage: 'en', maintenanceMode: false,
  maxProfilesPerAccount: 5, enableDownloads: false, defaultVideoQuality: 'AUTO',
  enableContinueWatching: true, tmdbApiEnabled: true,
  allowRegistration: true, requireEmailVerification: false, allowGoogleOAuth: true, allowGithubOAuth: false, sessionDurationDays: 30,
  fromEmail: '', emailWelcome: true, emailNewsletterDefault: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('platform')

  function set(key: string, value: string | boolean | number) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // In a real implementation: POST to /api/admin/settings
  }

  const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red'
  const currentSection = SECTIONS.find((s) => s.id === activeSection)!

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-400 mt-1">Configure your streaming platform</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          {saved ? <><FiCheckCircle /> Saved!</> : <><FiSave /> Save Changes</>}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-xl p-4 text-green-400 text-sm">
          <FiCheckCircle /> Settings saved successfully.
          <span className="text-gray-500 text-xs ml-auto">Note: Some settings require a server restart to take effect.</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${activeSection === sec.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
            >
              <span className={activeSection === sec.id ? 'text-netflix-red' : ''}>{sec.icon}</span>
              {sec.title}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-netflix-red">{currentSection.icon}</span>
            {currentSection.title} Settings
          </h2>
          <div className="space-y-5 divide-y divide-gray-800">
            {currentSection.fields.map((field) => (
              <div key={field.key} className={`${field.type !== 'toggle' ? 'space-y-1.5' : 'flex items-center justify-between'} pt-5 first:pt-0`}>
                {field.type === 'toggle' ? (
                  <>
                    <div>
                      <p className="text-sm font-medium">{field.label}</p>
                      {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
                    </div>
                    <button
                      onClick={() => set(field.key, !settings[field.key])}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings[field.key] ? 'bg-netflix-red' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[field.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </>
                ) : (
                  <>
                    <label className="text-sm font-medium block">{field.label}</label>
                    {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
                    {field.type === 'select' ? (
                      <select value={String(settings[field.key])} onChange={(e) => set(field.key, e.target.value)} className={inp}>
                        {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={String(settings[field.key])}
                        onChange={(e) => set(field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                        placeholder={field.placeholder}
                        className={inp}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
