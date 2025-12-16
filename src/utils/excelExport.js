import * as XLSX from 'xlsx'

export const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export const exportMultipleSheets = (sheets, filename) => {
  const wb = XLSX.utils.book_new()
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

