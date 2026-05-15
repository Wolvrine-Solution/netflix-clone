import { prisma } from '@netflix/db'

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { profiles: true, subscription: true },
    take: 50,
  })
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-gray-400 mt-1">{users.length} users</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-6 py-4">User</th>
              <th className="text-left px-6 py-4">Profiles</th>
              <th className="text-left px-6 py-4">Plan</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.image && <img src={user.image} alt="" className="w-8 h-8 rounded-full" />}
                    <div>
                      <p className="font-medium">{user.name ?? 'Unknown'}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{user.profiles.length}</td>
                <td className="px-6 py-4">
                  {user.subscription ? (
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
                      {user.subscription.plan}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">None</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.subscription?.status === 'ACTIVE' ? (
                    <span className="text-xs text-green-400">Active</span>
                  ) : (
                    <span className="text-xs text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
