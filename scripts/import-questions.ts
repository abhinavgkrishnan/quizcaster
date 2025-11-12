import * as XLSX from 'xlsx'
import { db } from '../lib/db/client'
import { questions, topics } from '../lib/db/schema'
import * as fs from 'fs'
import * as path from 'path'

async function importQuestions() {
  const questionBankDir = path.join(process.cwd(), 'Question Bank')
  const files = fs.readdirSync(questionBankDir).filter(f => f.endsWith('.xlsx'))

  console.log(`Found ${files.length} Excel files to import...`)

  for (const file of files) {
    const filePath = path.join(questionBankDir, file)
    const topicSlug = file.replace('_Quiz.xlsx', '').toLowerCase().replace('_', '-')

    console.log(`\nImporting ${file} as topic: ${topicSlug}`)

    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)

    console.log(`  Found ${data.length} questions`)

    // Import questions
    let imported = 0
    for (const row of data as any[]) {
      // Excel columns: Question, Option A, Option B, Option C, Option D, CorrectOption (A/B/C/D), Difficulty, ImageURL
      const optionA = row['Option A']
      const optionB = row['Option B']
      const optionC = row['Option C']
      const optionD = row['Option D']
      const correctOption = row['CorrectOption']?.toString().toUpperCase()

      if (!optionA || !optionB || !optionC || !optionD || !row['Question'] || !correctOption) {
        console.log(`  Skipping invalid row (missing data):`, row)
        continue
      }

      // Map correct option letter to actual answer text
      const correctAnswerMap: Record<string, string> = {
        'A': optionA,
        'B': optionB,
        'C': optionC,
        'D': optionD
      }

      const correctAnswer = correctAnswerMap[correctOption]
      if (!correctAnswer) {
        console.log(`  Skipping invalid row (invalid CorrectOption: ${correctOption}):`, row)
        continue
      }

      try {
        await db.insert(questions).values({
          topic: topicSlug,
          question: row['Question'],
          options: [optionA, optionB, optionC, optionD],  // Stored in original order
          correctAnswer: correctAnswer,  // Store the actual answer text
          imageUrl: row['ImageURL'] || row['Image'] || null,
          difficulty: row['Difficulty']?.toLowerCase() || null,
          isActive: true
        })
        imported++
      } catch (error) {
        console.error(`  Error importing question:`, error)
      }
    }

    console.log(`  Imported ${imported}/${data.length} questions`)
  }

  // Update topic question counts
  console.log('\nUpdating topic question counts...')
  await db.execute(`
    UPDATE topics t
    SET question_count = (
      SELECT COUNT(*)
      FROM questions q
      WHERE q.topic = t.slug
      AND q.is_active = true
    )
  `)

  console.log('✅ Import complete!')
  process.exit(0)
}

importQuestions().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})
