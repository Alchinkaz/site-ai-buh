"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, CheckCircle, XCircle, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  timestamp: string
  actions?: {
    label: string
    type: "confirm" | "cancel"
  }[]
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Здравствуйте! Я ваш ИИ-бухгалтер. Чем могу помочь сегодня?",
    timestamp: "10:00",
  },
  {
    id: 2,
    role: "user",
    content: "Добавь расход 15 000₸ на бензин сегодня",
    timestamp: "10:01",
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Расход добавлен:\n• Категория: Транспорт (Бензин)\n• Сумма: 15 000₸\n• Дата: 15 октября 2025\n\nЧто-нибудь еще?",
    timestamp: "10:01",
  },
  {
    id: 4,
    role: "user",
    content: "Когда нужно отправить АВР по договору с Альфа?",
    timestamp: "10:05",
  },
  {
    id: 5,
    role: "assistant",
    content:
      'По договору № 78 с ТОО "Альфа Строй" срок отправки АВР - 15 октября 2025 (сегодня).\n\nХотите, чтобы я подготовил и отправил документ?',
    timestamp: "10:05",
    actions: [
      { label: "Подтвердить", type: "confirm" },
      { label: "Отложить", type: "cancel" },
    ],
  },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "Понял ваш запрос. Обрабатываю информацию...",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // In production, this would use Web Speech API or similar
    if (!isRecording) {
      setTimeout(() => {
        setInput("Добавь расход 15 000 тенге на бензин")
        setIsRecording(false)
      }, 2000)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Чат с ИИ-бухгалтером</h1>
        <p className="text-muted-foreground mt-2">Управляйте бухгалтерией через естественный диалог</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                <p className="text-sm whitespace-pre-wrap text-pretty">{message.content}</p>
                {message.actions && (
                  <div className="flex gap-2 mt-4">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={action.type === "confirm" ? "default" : "outline"}
                        className={cn(
                          message.role === "assistant" &&
                            action.type === "confirm" &&
                            "bg-success hover:bg-success/90 text-success-foreground",
                        )}
                      >
                        {action.type === "confirm" ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={handleVoiceInput}
              className={cn(isRecording && "animate-pulse")}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Добавь расход 20 000₸ на офисные принадлежности")}
            >
              Добавить расход
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInput("Покажи отчет по доходам за месяц")}>
              Отчет по доходам
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInput("Рассчитай налоги за квартал")}>
              Рассчитать налоги
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
