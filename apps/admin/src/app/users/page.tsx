import { prisma } from '@netflix/db'
import Link from 'next/link'
import { FiSearch } from 'react-icons/fi'
import { UserActions } from './UserActions'

async function getUsers(page: number, q: string, role: string, status: string) {
  const limit = 20
  const skip = (page - 1) * limit
  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(role ? { role: role as 'USER' | 'ADMIN' } : {}),
    ...(status === 'suspended'
      ? { isSuspended: true }
      : status === 'active'
        ? { isSuspended: false }
        : {}),
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        profiles: { select: { id: true } },
        subscription: { select: { plan: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ])
  return { users, total, pages: Math.ceil(total / limit) }
}

interface PageProps {
  searchParams: { page?: string; q?: string; role?: string; status?: string }
}

export default async function UsersPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const q = searchParams.q ?? ''
  const role = searchParams.role ?? ''
  const status = searchParams.status ?? ''
  const { users, total, pages } = await getUsers(page, q, role, status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="mt-1 text-gray-400">{total} users</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="focus:border-netflix-red w-56 rounded-lg border border-gray-700 bg-gray-900 py-2 pl-8 pr-4 text-sm text-white outline-none"
          />
        </div>
        <select
          name="role"
          defaultValue={role}
          className="focus:border-netflix-red rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="focus:border-netflix-red rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
        >
          Filter
        </button>
        {(q || role || status) && (
          <Link href="/users" className="px-3 py-2 text-sm text-gray-400 hover:text-white">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 text-gray-400">
            <tr>
              <th className="px-5 py-3.5 text-left">User</th>
              <th className="px-5 py-3.5 text-left">Role</th>
              <th className="px-5 py-3.5 text-left">Profiles</th>
              <th className="px-5 py-3.5 text-left">Plan</th>
              <th className="px-5 py-3.5 text-left">Status</th>
              <th className="px-5 py-3.5 text-left">Joined</th>
              <th className="px-5 py-3.5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`transition hover:bg-gray-800/30 ${user.isSuspended ? 'opacity-60' : ''}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-8 w-8 flex-shrink-0 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
                        <span className="text-xs text-gray-400">
                          {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium leading-tight">{user.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-netflix-red/20 text-netflix-red' : 'bg-gray-800 text-gray-400'}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400">{user.profiles.length}</td>
                <td className="px-5 py-3.5">
                  {user.subscription ? (
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${user.subscription.status === 'ACTIVE' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                      {user.subscription.plan}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">None</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {user.isSuspended ? (
                    <span className="text-xs text-red-400">Suspended</span>
                  ) : (
                    <span className="text-xs text-green-400">Active</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <UserActions
                    userId={user.id}
                    userName={user.name ?? user.email ?? ''}
                    currentRole={user.role as 'USER' | 'ADMIN'}
                    isSuspended={user.isSuspended}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&q=${q}&role=${role}&status=${status}`}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${p === page ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
