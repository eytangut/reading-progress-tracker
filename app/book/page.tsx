"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Calendar, TrendingUp, Target } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Book {
  id: string
  title: string
  author: string
  totalPages: number
  currentPage: number
  dailyReading: { [date: string]: number }
  createdAt: string
}

export default function BookPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookId = searchParams.get("id")

  const [book, setBook] = useState<Book | null>(null)
  const [pagesRead, setPagesRead] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookId) {
      router.push("/")
      return
    }

    const books = JSON.parse(localStorage.getItem("books") || "[]")
    const foundBook = books.find((b: Book) => b.id === bookId)

    if (!foundBook) {
      router.push("/")
      return
    }

    setBook(foundBook)
    setLoading(false)
  }, [bookId, router])

  const addPagesToday = () => {
    if (!book || !pagesRead || Number.parseInt(pagesRead) <= 0) return

    const today = new Date().toISOString().split("T")[0]
    const pagesToAdd = Number.parseInt(pagesRead)

    const updatedBook = {
      ...book,
      currentPage: Math.min(book.currentPage + pagesToAdd, book.totalPages),
      dailyReading: {
        ...book.dailyReading,
        [today]: (book.dailyReading[today] || 0) + pagesToAdd,
      },
    }

    const books = JSON.parse(localStorage.getItem("books") || "[]")
    const updatedBooks = books.map((b: Book) => (b.id === book.id ? updatedBook : b))
    localStorage.setItem("books", JSON.stringify(updatedBooks))

    setBook(updatedBook)
    setPagesRead("")
  }

  const getChartData = () => {
    if (!book) return []

    const last30Days = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      last30Days.push({
        date: dateStr,
        pages: book.dailyReading[dateStr] || 0,
        displayDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })
    }

    return last30Days
  }

  const calculatePredictions = () => {
    if (!book) return { historicalDays: 0, todayPaceDays: 0 }

    const remainingPages = book.totalPages - book.currentPage
    if (remainingPages <= 0) return { historicalDays: 0, todayPaceDays: 0 }

    // Historical average
    const readingDays = Object.values(book.dailyReading).filter((pages) => pages > 0)
    const historicalAvg =
      readingDays.length > 0 ? readingDays.reduce((sum, pages) => sum + pages, 0) / readingDays.length : 0

    // Today's pace
    const today = new Date().toISOString().split("T")[0]
    const todayPages = book.dailyReading[today] || 0

    return {
      historicalDays: historicalAvg > 0 ? Math.ceil(remainingPages / historicalAvg) : 0,
      todayPaceDays: todayPages > 0 ? Math.ceil(remainingPages / todayPages) : 0,
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (!book) {
    return <div className="container mx-auto p-4">Book not found</div>
  }

  const progress = (book.currentPage / book.totalPages) * 100
  const remainingPages = book.totalPages - book.currentPage
  const { historicalDays, todayPaceDays } = calculatePredictions()
  const today = new Date().toISOString().split("T")[0]
  const todayReading = book.dailyReading[today] || 0

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {book.title}
            </CardTitle>
            <CardDescription>by {book.author}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {book.currentPage} / {book.totalPages} pages
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {progress.toFixed(1)}% complete • {remainingPages} pages remaining
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Pages read today"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                min="1"
                max={remainingPages}
              />
              <Button onClick={addPagesToday} disabled={!pagesRead || Number.parseInt(pagesRead) <= 0}>
                Add Pages
              </Button>
            </div>

            {todayReading > 0 && (
              <Badge variant="secondary" className="w-fit">
                <Calendar className="h-3 w-3 mr-1" />
                {todayReading} pages read today
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Completion Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historicalDays > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Based on your average</p>
                  <p className="text-sm text-muted-foreground">Historical reading pace</p>
                </div>
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {historicalDays} days
                </Badge>
              </div>
            )}

            {todayPaceDays > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">At today's pace</p>
                  <p className="text-sm text-muted-foreground">If you read {todayReading} pages daily</p>
                </div>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {todayPaceDays} days
                </Badge>
              </div>
            )}

            {historicalDays === 0 && todayPaceDays === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Start reading to see completion predictions!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reading Progress (Last 30 Days)</CardTitle>
          <CardDescription>Daily pages read over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" fontSize={12} interval="preserveStartEnd" />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [`${value} pages`, "Pages Read"]}
                />
                <Line
                  type="monotone"
                  dataKey="pages"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
