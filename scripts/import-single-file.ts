import * as XLSX from 'xlsx'
import { db } from '../lib/db/client'
import { questions } from '../lib/db/schema'

const file = process.argv[2]

if (!file) {
  console.error('Usage: bun scripts/import-single-file.ts <path-to-excel-file>')
  process.exit(1)
}

async function importQuestions() {
  console.log(`Importing ${file}...`)

  // Extract topic from filename
  const fileName = file.split('/').pop()!
  const topicSlug = fileName
    .replace('_Quiz_with_Correct_Options.xlsx', '')
    .replace('_Quiz.xlsx', '')
    .toLowerCase()
    .replace(/_/g, '-')

  console.log(`Topic: ${topicSlug}`)

  // Read Excel file
  const workbook = XLSX.readFile(file)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet)

  console.log(`Found ${data.length} questions\n`)

  // Import questions
  let imported = 0
  for (const row of data as any[]) {
    const optionA = row['Option A']
    const optionB = row['Option B']
    const optionC = row['Option C']
    const optionD = row['Option D']
    const correctOption = row['CorrectOption']?.toString().toUpperCase()

    if (!optionA || !optionB || !optionC || !optionD || !row['Question'] || !correctOption) {
      console.log(`Skipping invalid row (missing data):`, row)
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
      console.log(`Skipping invalid row (invalid CorrectOption: ${correctOption}):`, row)
      continue
    }

    try {
      await db.insert(questions).values({
        topic: topicSlug,
        question: row['Question'],
        options: [optionA, optionB, optionC, optionD],
        correctAnswer: correctAnswer,
        imageUrl: row['ImageURL'] || row['Image'] || null,
        difficulty: row['Difficulty']?.toLowerCase() || null,
        isActive: true
      })
      imported++
      if (imported % 10 === 0) {
        console.log(`  Imported ${imported}/${data.length}...`)
      }
    } catch (error) {
      console.error(`Error importing question:`, error)
    }
  }

  console.log(`\n✅ Imported ${imported}/${data.length} questions for topic: ${topicSlug}`)
  process.exit(0)
}

importQuestions().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})
