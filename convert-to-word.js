import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { readFileSync, writeFileSync } from 'fs'

// Read the markdown file
const markdownContent = readFileSync('USER_GUIDE.md', 'utf-8')

// Parse markdown and convert to Word document structure
const lines = markdownContent.split('\n')
const children = []

let currentListItems = []
let inCodeBlock = false
let codeBlockContent = []

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  
  // Handle code blocks
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      // End of code block
      if (codeBlockContent.length > 0) {
        children.push(
          new Paragraph({
            text: codeBlockContent.join('\n'),
            style: 'Code',
            spacing: { after: 200 }
          })
        )
        codeBlockContent = []
      }
      inCodeBlock = false
    } else {
      inCodeBlock = true
    }
    continue
  }
  
  if (inCodeBlock) {
    codeBlockContent.push(line)
    continue
  }
  
  // Handle headers
  if (line.startsWith('# ')) {
    children.push(
      new Paragraph({
        text: line.substring(2).trim(),
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 }
      })
    )
  } else if (line.startsWith('## ')) {
    children.push(
      new Paragraph({
        text: line.substring(3).trim(),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )
  } else if (line.startsWith('### ')) {
    children.push(
      new Paragraph({
        text: line.substring(4).trim(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    )
  } else if (line.startsWith('#### ')) {
    children.push(
      new Paragraph({
        text: line.substring(5).trim(),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 }
      })
    )
  } else if (line.startsWith('- ') || line.startsWith('* ')) {
    // List item
    const text = line.substring(2).trim()
    currentListItems.push(
      new Paragraph({
        text: text,
        bullet: { level: 0 },
        spacing: { after: 100 }
      })
    )
  } else if (line.startsWith('  - ') || line.startsWith('  * ')) {
    // Nested list item
    const text = line.substring(4).trim()
    currentListItems.push(
      new Paragraph({
        text: text,
        bullet: { level: 1 },
        spacing: { after: 100 }
      })
    )
  } else if (line.trim() === '') {
    // Empty line - flush list items if any
    if (currentListItems.length > 0) {
      children.push(...currentListItems)
      currentListItems = []
    }
    // Add spacing paragraph
    children.push(
      new Paragraph({
        spacing: { after: 200 }
      })
    )
  } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
    // Bold text (likely a label)
    const text = line.trim().replace(/\*\*/g, '')
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      })
    )
  } else if (line.trim() !== '') {
    // Regular paragraph
    // Handle bold text within paragraph
    const parts = []
    let remaining = line.trim()
    
    while (remaining.length > 0) {
      const boldStart = remaining.indexOf('**')
      if (boldStart === -1) {
        if (remaining.length > 0) {
          parts.push(new TextRun(remaining))
        }
        break
      }
      
      if (boldStart > 0) {
        parts.push(new TextRun(remaining.substring(0, boldStart)))
      }
      
      const boldEnd = remaining.indexOf('**', boldStart + 2)
      if (boldEnd === -1) {
        parts.push(new TextRun(remaining.substring(boldStart)))
        break
      }
      
      parts.push(
        new TextRun({
          text: remaining.substring(boldStart + 2, boldEnd),
          bold: true
        })
      )
      
      remaining = remaining.substring(boldEnd + 2)
    }
    
    children.push(
      new Paragraph({
        children: parts.length > 0 ? parts : [new TextRun(line.trim())],
        spacing: { after: 200 }
      })
    )
  }
}

// Flush any remaining list items
if (currentListItems.length > 0) {
  children.push(...currentListItems)
}

// Create the document
const doc = new Document({
  sections: [
    {
      properties: {},
      children: children
    }
  ],
  styles: {
    default: {
      document: {
        run: {
          font: 'Calibri',
          size: 22
        },
        paragraph: {
          spacing: { line: 276, lineRule: 'auto' }
        }
      }
    }
  }
})

// Generate and save the Word document
Packer.toBuffer(doc).then(buffer => {
  writeFileSync('USER_GUIDE.docx', buffer)
  console.log('✅ Successfully converted USER_GUIDE.md to USER_GUIDE.docx')
}).catch(error => {
  console.error('❌ Error converting to Word:', error)
  process.exit(1)
})

