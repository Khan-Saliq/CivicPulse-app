import dns from 'dns'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dns.setServers(['8.8.8.8', '1.1.1.1'])
console.log('Using DNS servers for cleanup script:', dns.getServers())

dotenv.config()

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI not set in .env')
  process.exit(1)
}

async function main() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db()
    console.log('Connected to database:', db.databaseName)

    const usersColl = db.collection('users')
    const issuesColl = db.collection('issues')

    const demoEmails = ['citizen@demo.com', 'rahul@demo.com', 'admin@demo.com']
    const demoNames = ['Priya Sharma', 'Rahul Verma', 'Admin Officer']

    console.log('About to delete users with emails:', demoEmails)
    const usersRes = await usersColl.deleteMany({ email: { $in: demoEmails } })
    console.log('Deleted users count:', usersRes.deletedCount)

    console.log('About to delete issues reported by demo reporters:', demoNames)
    const issuesByReporter = await issuesColl.deleteMany({ reporterName: { $in: demoNames } })
    console.log('Deleted issues (by reporterName):', issuesByReporter.deletedCount)

    console.log("Also deleting issues with seeded clusterId pattern 'cluster-' (if any).")
    const clusterRes = await issuesColl.deleteMany({ clusterId: { $regex: '^cluster-' } })
    console.log('Deleted issues (clusterId):', clusterRes.deletedCount)

    console.log('Cleanup complete.')
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
