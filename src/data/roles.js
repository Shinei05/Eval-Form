import { GraduationCap, ShieldCheck, UserRound } from '@lucide/vue'

export const roles = [
  {
    id: 'student',
    label: 'Student',
    description: 'Evaluate your teachers and earn points for participating.',
    signInTitle: 'Student Sign In',
    signInSubtitle: 'Enter your student credentials',
    identifierLabel: 'Student ID / Email',
    identifierPlaceholder: 'your@email.com or Student ID',
    identifierType: 'text',
    theme: {
      iconBg: 'bg-indigo-50',
      iconFg: 'text-indigo-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
      link: 'text-indigo-700 hover:text-indigo-900',
      accent: 'bg-indigo-600',
    },
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Evaluate your peers and view your performance results.',
    signInTitle: 'Teacher Sign In',
    signInSubtitle: 'Enter your teacher credentials',
    identifierLabel: 'Teacher ID / Email',
    identifierPlaceholder: 'your@email.com or Teacher ID',
    identifierType: 'text',
    theme: {
      iconBg: 'bg-emerald-50',
      iconFg: 'text-emerald-700',
      button: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900',
      link: 'text-emerald-700 hover:text-emerald-900',
      accent: 'bg-emerald-700',
    },
  },
  {
    id: 'admin',
    label: 'Administrator',
    description: 'Manage evaluations, accounts, and system settings.',
    signInTitle: 'Admin Sign In',
    signInSubtitle: 'Enter your administrator credentials',
    identifierLabel: 'Admin ID / Email',
    identifierPlaceholder: 'Enter your admin ID or email',
    identifierType: 'text',
    theme: {
      iconBg: 'bg-red-50',
      iconFg: 'text-red-700',
      button: 'bg-red-700 hover:bg-red-800 active:bg-red-900',
      link: 'text-red-700 hover:text-red-900',
      accent: 'bg-red-700',
    },
  },
]

export const roleIcons = {
  student: GraduationCap,
  teacher: UserRound,
  admin: ShieldCheck,
}

export function getRole(id) {
  return roles.find((role) => role.id === id) ?? roles[0]
}
