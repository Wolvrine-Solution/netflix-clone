import { prisma } from '@netflix/db'

async function getRows() {
  return prisma.row.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { contents: true } } },
  })
}

export default async function RowsPage() {
  const rows = await getRows()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Rows</h1>
        <p className="text-gray-400 mt-1">Configure which rows appear on the browse page</p>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-center gap-4 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <span className="text-gray-600 w-8 text-center font-mono">{i + 1}</span>
            <div className="flex-1">
              <p className="font-semibold">{row.title}</p>
              <p className="text-xs text-gray-400">{row.query} — {row._count.contents} items</p>
            </div>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">Order: {row.order}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No rows configured. Run the seed script to add default rows.</p>
          </div>
        )}
      </div>
    </div>
  )
}
