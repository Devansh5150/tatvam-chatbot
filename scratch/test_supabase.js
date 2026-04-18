const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manual env parsing since we don't have dotenv easily available in node process
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value.length > 0) {
        envVars[key.trim()] = value.join('=').trim()
    }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl)
    console.log('Using Key:', supabaseServiceKey?.substring(0, 15) + '...')
    
    if (!supabaseServiceKey?.startsWith('eyJ')) {
        console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is still invalid!')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Attempting to fetch profiles count...')
    const { data, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    
    if (error) {
        console.error('Connection Failed:', error)
    } else {
        console.log('✅ Connection Successful! System is ready to persist chats.')
    }
}

testConnection()
