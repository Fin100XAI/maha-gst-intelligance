import { Lock } from 'lucide-react'
import { canAccessModule, useApp } from '../../context/AppContext.jsx'

export function RoleGate({ moduleId, children }) {
  const { role } = useApp()
  if (canAccessModule(role, moduleId)) return children

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-14 h-14 rounded-2xl bg-steel-100 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-steel-500" />
      </div>
      <h2 className="text-base font-bold text-navy-900">Access Restricted</h2>
      <p className="text-sm text-steel-500 mt-1.5 max-w-md">
        Your current role — <span className="font-semibold text-navy-700">{role}</span> — does not have permission to view this module.
        This restriction is enforced by role-based access control as part of the platform's governance and security framework.
      </p>
      <p className="text-[11px] text-steel-400 mt-3">Contact your AI Governance Officer or system administrator if you believe this is an error.</p>
    </div>
  )
}
