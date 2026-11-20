import { runMigrations, closeDb } from './client'

await runMigrations()
await closeDb()
console.log('migrations applied')
