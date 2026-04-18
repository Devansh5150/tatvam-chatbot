import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role to bypass RLS for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const initialScriptures = [
  {
    source: 'Bhagavad Gita',
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    hindi: 'तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं। न तुम कर्मफल के कारण बनो, और न ही कर्म न करने में तुम्हारी आसक्ति हो।',
    english: 'You have the right to perform your actions, but you are not entitled to the fruits of those actions. Do not let the fruit be your motive, nor let yourself be attached to inaction.',
    themes: ['karma', 'duty', 'attachment', 'peace'],
    reflection: 'What if your peace didn\'t depend on outcomes?',
  },
  {
    source: 'Bhagavad Gita',
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मन:॥',
    hindi: 'मनुष्य को चाहिए कि वह अपने मन के द्वारा अपना उद्धार करे, अपने को अधोगति में न डाले। क्योंकि मन ही आत्मा का मित्र है और मन ही आत्मा का शत्रु है।',
    english: 'Elevate yourself through the power of your own mind, and do not degrade yourself. For the mind is the friend of the self, and the mind is also the enemy of the self.',
    themes: ['mindset', 'self-elevation', 'discipline', 'liberation'],
    reflection: 'Is your mind acting as your friend or your enemy right now?',
  },
  {
    source: 'Ramayana',
    chapter: null,
    verse: null,
    sanskrit: 'जननी जन्मभूमिश्च स्वर्गादपि गरीयसी।',
    hindi: 'माता और जन्मभूमि स्वर्ग से भी बढ़कर हैं।',
    english: 'Mother and motherland are superior even to heaven.',
    themes: ['devotion', 'gratitude', 'roots', 'family'],
    reflection: 'What part of your roots gives you the most strength today?',
  },
  {
    source: 'Mahabharata',
    chapter: null,
    verse: null,
    sanskrit: 'धर्मो रक्षति रक्षितः।',
    hindi: 'जो धर्म की रक्षा करता है, धर्म उसकी रक्षा करता है।',
    english: 'Those who protect righteousness (dharma) are in turn protected by righteousness.',
    themes: ['dharma', 'righteousness', 'protection', 'integrity'],
    reflection: 'What is one small act of integrity you can commit to today?',
  }
]

async function seed() {
  console.log('🌱 Seeding scriptures...')
  const { data, error } = await supabase
    .from('scriptures')
    .insert(initialScriptures)

  if (error) {
    console.error('Error seeding data:', error)
  } else {
    console.log('✅ Successfully seeded scriptures!')
  }
}

seed()
