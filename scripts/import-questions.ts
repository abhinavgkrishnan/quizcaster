#!/usr/bin/env bun
/**
 * Import questions from CSV to Supabase
 * Usage: bun scripts/import-questions.ts <filename.csv>
 *
 * CSV Format:
 * topic,question,option1,option2,option3,option4,correct_answer,difficulty,image_url
 *
 * Example:
 * biology,What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi,Mitochondria,easy,
 */

import { readFileSync } from 'fs';
import { supabase } from '../lib/utils/supabase';

interface QuestionRow {
  topic: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer: string;
  difficulty?: string;
  image_url?: string;
}

function parseCSV(content: string): QuestionRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    // Simple CSV parser (doesn't handle quoted commas)
    const values = line.split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row;
  });
}

async function importQuestions(filename: string) {
  console.log(`📖 Reading file: ${filename}`);

  const content = readFileSync(filename, 'utf-8');
  const rows = parseCSV(content);

  console.log(`✅ Found ${rows.length} questions`);

  const questions = rows.map(row => ({
    topic: row.topic,
    question: row.question,
    options: [row.option1, row.option2, row.option3, row.option4].filter(o => o),
    correct_answer: row.correct_answer,
    difficulty: row.difficulty || null,
    image_url: row.image_url || null,
    is_active: true,
  }));

  console.log('🚀 Uploading to Supabase...');

  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select('id');

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${data?.length} questions!`);
}

// Main
const filename = process.argv[2];

if (!filename) {
  console.error('Usage: bun scripts/import-questions.ts <filename.csv>');
  process.exit(1);
}

importQuestions(filename).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
