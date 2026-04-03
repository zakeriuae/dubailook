'use client'

import React from 'react'

interface FormattedTextProps {
  text: string
  className?: string
}

export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text) return null

  // Function to parse the text and handle basic formatting
  const parseText = (content: string) => {
    // 1. Split by bold markers (**text** or *text*)
    // We use a non-greedy regex to match the inner content
    const parts = content.split(/(\*\*[\s\S]+?\*\*|\*[\s\S]+?\*)/)

    return parts.map((part, index) => {
      // Bold with **
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
      }
      // Bold with * (Telegram style)
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={index} className="font-bold text-foreground">{part.slice(1, -1)}</strong>
      }
      
      // For non-bold parts, we can handle italics if needed (_text_)
      const italicParts = part.split(/(__[\s\S]+?__| _[\s\S]+?_)/)
      return italicParts.map((iPart, iIndex) => {
        if (iPart.startsWith('__') && iPart.endsWith('__')) {
          return <em key={`${index}-${iIndex}`} className="italic">{iPart.slice(2, -2)}</em>
        }
        if (iPart.startsWith('_') && iPart.endsWith('_')) {
          return <em key={`${index}-${iIndex}`} className="italic">{iPart.slice(1, -1)}</em>
        }
        return iPart
      })
    })
  }

  return (
    <div className={className}>
      {text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {parseText(line)}
          <br />
        </React.Fragment>
      ))}
    </div>
  )
}
