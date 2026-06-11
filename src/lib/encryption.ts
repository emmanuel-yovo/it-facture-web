import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Fonction pour récupérer la clé d'encryption depuis l'environnement
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'default_32_character_secret_key_12'
  
  const keyBuffer = Buffer.from(key, 'utf-8')
  // Si la clé fait exactement 32 octets, on l'utilise directement (compatibilité)
  if (keyBuffer.length === 32) {
    return keyBuffer
  }
  
  // Sinon, on la hache avec SHA-256 pour garantir exactement 32 octets sans crasher
  return crypto.createHash('sha256').update(key).digest()
}

export function encrypt(text: string): string {
  if (!text) return text
  
  const iv = crypto.randomBytes(16)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText
  
  // Si le texte n'a pas le bon format (ancienne clé en clair par ex), on la retourne telle quelle
  // Attention: en prod, il faudra migrer les anciennes clés
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    return encryptedText 
  }
  
  try {
    const [ivHex, authTagHex, encryptedDataHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = getEncryptionKey()
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error)
    return '' // Retourne vide en cas d'échec pour ne pas faire crasher l'app
  }
}
