import { authenticator } from 'otplib'

const APP_NAME = 'Netflix Clone Admin'

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function getTotpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, APP_NAME, secret)
}

export function verifyTotpCode(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret })
}
