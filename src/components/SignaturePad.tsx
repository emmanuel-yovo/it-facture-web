'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser, Check } from 'lucide-react'

interface SignaturePadProps {
  onSave: (data: string) => void
  onClear?: () => void
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.beginPath()
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
    }
    if (onClear) onClear()
  }

  const save = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const data = canvas.toDataURL('image/png')
      onSave(data)
    }
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl bg-white overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-[200px]"
        />
      </div>
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={clear}>
          <Eraser className="w-4 h-4 mr-2" /> Effacer
        </Button>
        <Button size="sm" onClick={save} className="bg-emerald-600 hover:bg-emerald-700">
          <Check className="w-4 h-4 mr-2" /> Valider la signature
        </Button>
      </div>
    </div>
  )
}
