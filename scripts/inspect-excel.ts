import * as XLSX from 'xlsx'

const file = process.argv[2] || 'Question Bank/Science_Quiz.xlsx'
const workbook = XLSX.readFile(file)
const sheetName = workbook.SheetNames[0]
const sheet = workbook.Sheets[sheetName]
const data = XLSX.utils.sheet_to_json(sheet)

console.log('Sheet name:', sheetName)
console.log('Total rows:', data.length)
console.log('\nFirst 2 rows:')
console.log(JSON.stringify(data.slice(0, 2), null, 2))
console.log('\nColumn names:')
console.log(Object.keys(data[0] as any))
