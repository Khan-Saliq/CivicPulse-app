import dns from 'dns'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dns.setServers(['8.8.8.8', '1.1.1.1'])
dotenv.config()

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is not set in .env')
  process.exit(1)
}

async function run() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    const users = db.collection('users')

    const allUsers = await users.find({}).toArray()
    
    console.log('\n=== Registered Users ===\n')
    console.log(`Total users: ${allUsers.length}\n`)
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Department: ${user.department || 'N/A'}`)
      console.log('')
    })
    
    console.log('\nTo promote a user to admin, run:')
    console.log('node scripts/promote_admin.js <email>')
    console.log('\nExample:')
    console.log('node scripts/promote_admin.js user@example.com\n')
  } finally {
    await client.close()
  }
}

run().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
