import dns from 'dns'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dns.setServers(['8.8.8.8', '1.1.1.1'])
console.log('Using DNS servers for promote script:', dns.getServers())

dotenv.config()

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is not set in .env')
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/promote_admin.js user@example.com')
  process.exit(1)
}

async function run() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const users = db.collection('users')

    const result = await users.updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } })
    if (result.matchedCount === 0) {
      console.error('No user found with email:', email)
      process.exit(1)
    }
    console.log(`User ${email} promoted to admin.`)
  } finally {
    await client.close()
  }
}

run().catch((err) => {
  console.error('Promotion failed:', err)
  process.exit(1)
})
