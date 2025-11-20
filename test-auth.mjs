import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local manually
try {
  const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
} catch (err) {
  console.error('Could not load .env.local:', err.message)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local')
  console.log('Make sure you have:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your-url')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('\n🧪 Testing Supabase Auth...\n')
  
  // Use a simple email without timestamp to avoid validation issues
  const testEmail = 'testuser@gmail.com'
  const testPassword = 'TestPassword123!'
  
  console.log('⚠️  NOTE: Using fixed email. If it already exists, the test will still work.')
  console.log('   Or change the email in test-auth.mjs to test with a different account.')
  
  console.log('Test Credentials:')
  console.log('  Email:', testEmail)
  console.log('  Password:', testPassword)
  
  // Test 1: Sign Up
  console.log('\n1️⃣ Testing Sign Up...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })
  
  if (signUpError) {
    console.error('❌ Sign Up Failed:', signUpError.message)
    return false
  }
  
  console.log('✅ Sign Up Success!')
  console.log('   User ID:', signUpData.user?.id)
  console.log('   Email:', signUpData.user?.email)
  console.log('   Has Session:', signUpData.session ? 'Yes' : 'No')
  
  if (!signUpData.session) {
    console.warn('⚠️  No session after signup - email confirmation may be required')
  }
  
  // Test 2: Sign Out
  console.log('\n2️⃣ Testing Sign Out...')
  const { error: signOutError } = await supabase.auth.signOut()
  
  if (signOutError) {
    console.error('❌ Sign Out Failed:', signOutError.message)
    return false
  }
  
  console.log('✅ Sign Out Success!')
  
  // Test 3: Sign In
  console.log('\n3️⃣ Testing Sign In...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })
  
  if (signInError) {
    console.error('❌ Sign In Failed:', signInError.message)
    if (signInError.message.includes('Email not confirmed')) {
      console.warn('⚠️  Email confirmation is required in your Supabase project.')
      console.log('   Go to Supabase Dashboard → Authentication → Providers → Email')
      console.log('   Disable "Confirm email" for testing')
    }
    return false
  }
  
  console.log('✅ Sign In Success!')
  console.log('   User ID:', signInData.user?.id)
  console.log('   Email:', signInData.user?.email)
  console.log('   Has Session:', signInData.session ? 'Yes' : 'No')
  
  // Test 4: Get User
  console.log('\n4️⃣ Testing Get User...')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('❌ Get User Failed:', userError.message)
    return false
  }
  
  console.log('✅ Get User Success!')
  console.log('   User ID:', userData.user?.id)
  console.log('   Email:', userData.user?.email)
  
  // Test 5: Check if profile table is accessible
  console.log('\n5️⃣ Testing Profile Table Access...')
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userData.user.id)
    .single()
  
  if (profileError) {
    console.error('❌ Profile Check Failed:', profileError.message)
    if (profileError.message.includes('row-level security') || profileError.code === 'PGRST301') {
      console.error('\n⚠️  RLS ISSUE: You need to disable RLS!')
      console.log('\nRun this SQL in Supabase SQL Editor:')
      console.log('━'.repeat(50))
      console.log('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE services DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE leads DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE settings DISABLE ROW LEVEL SECURITY;')
      console.log('━'.repeat(50))
    }
    return false
  } else {
    console.log('✅ Profile Table Accessible!')
    console.log('   Profile exists:', profileData ? 'Yes' : 'No')
  }
  
  // Clean up
  console.log('\n6️⃣ Cleaning up...')
  await supabase.auth.signOut()
  console.log('✅ Cleanup Complete!')
  
  return true
}

console.log('═'.repeat(60))
console.log('           🧪 SUPABASE AUTH TEST SUITE')
console.log('═'.repeat(60))

testAuth()
  .then(success => {
    console.log('\n' + '═'.repeat(60))
    if (success) {
      console.log('🎉 ALL TESTS PASSED! Auth is working correctly.')
      console.log('═'.repeat(60))
      console.log('\n✅ You can now:\n')
      console.log('   1. Visit http://localhost:3000/signup')
      console.log('   2. Create an account')
      console.log('   3. You\'ll be redirected to onboarding')
      console.log('   4. Complete your profile')
      console.log('   5. You\'ll be redirected to dashboard\n')
      process.exit(0)
    } else {
      console.log('❌ TESTS FAILED! Check errors above.')
      console.log('═'.repeat(60))
      console.log('\nFix the issues and try again.\n')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n❌ Unexpected error:', err)
    process.exit(1)
  })
