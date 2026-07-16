process.env['DATABASE_URL'] ??= 'postgresql://postgres:password@localhost:5432/netflixclone_test'
process.env['NEXTAUTH_SECRET'] ??= 'test-secret-key-at-least-32-characters-long'
process.env['NODE_ENV'] = 'test'
