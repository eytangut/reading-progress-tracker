"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface Book {
  id: string
  title: string
  author: string
  totalPages: number
  currentPage: number
  dailyReadings: { [date: string]: number }
  createdAt: string
}

export default function BookClientPage() {
  const params = useParams()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [todaysPages, setTodaysPages] = useState("")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const savedBooks = localStorage.getItem("reading-tracker-books")
    if (savedBooks) {
      const books: Book[] = JSON.parse(savedBooks)
      const foundBook = books.find((b) => b.id === params.id)
      if (foundBook) {
        setBook(foundBook)
        generateChartData(foundBook)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [params.id, router])

  const generateChartData = (book: Book) => {
    const startDate = new Date(book.createdAt)
    const today = new Date()
    const data = []

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      const pages = book.dailyReadings[dateStr] || 0
      data.push({
        date: dateStr,
        pages,
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })
    }

    setChartData(data)
  }

  const updateTodaysReading = () => {
    if (!book || !todaysPages) return

    const pages = Number.parseInt(todaysPages)
    if (isNaN(pages) || pages < 0) return

    const today = new Date().toISOString().split("T")[0]
    const updatedBook = {
      ...book,
      currentPage: Math.min(book.currentPage + pages, book.totalPages),
      dailyReadings: {
        ...book.dailyReadings,
        [today]: (book.dailyReadings[today] || 0) + pages,
      },
    }

    // Update localStorage
    const savedBooks = localStorage.getItem("reading-tracker-books")
    if (savedBooks) {
      const books: Book[] = JSON.parse(savedBooks)
      const updatedBooks = books.map((b) => (b.id === book.id ? updatedBook : b))
      localStorage.setItem("reading-tracker-books", JSON.stringify(updatedBooks))
      setBook(updatedBook)
      generateChartData(updatedBook)
    }

    setTodaysPages("")
  }

  const getProgress = () => {
    if (!book) return 0
    return Math.min((book.currentPage / book.totalPages) * 100, 100)
  }

  const getTodaysReading = () => {
    if (!book) return 0
    const today = new Date().toISOString().split("T")[0]
    return book.dailyReadings[today] || 0
  }

  const getAverageDaily = () => {
    if (!book) return 0
    const readings = Object.values(book.dailyReadings).filter((pages) => pages > 0)
    if (readings.length === 0) return 0
    return readings.reduce((sum, pages) => sum + pages, 0) / readings.length
  }

  const predictCompletion = () => {
    if (!book) return { historicalDays: null, currentPaceDays: null }

    const remainingPages = book.totalPages - book.currentPage
    const avgDaily = getAverageDaily()
    const todaysReading = getTodaysReading()

    const historicalDays = avgDaily > 0 ? Math.ceil(remainingPages / avgDaily) : null
    const currentPaceDays = todaysReading > 0 ? Math.ceil(remainingPages / todaysReading) : null

    return { historicalDays, currentPaceDays }
  }

  const getCompletionDates = () => {
    const { historicalDays, currentPaceDays } = predictCompletion()
    const today = new Date()

    const historicalDate = historicalDays ? new Date(today.getTime() + historicalDays * 24 * 60 * 60 * 1000) : null
    const currentPaceDate = currentPaceDays ? new Date(today.getTime() + currentPaceDays * 24 * 60 * 60 * 1000) : null

    return { historicalDate, currentPaceDate }
  }

  if (!book) {
    return <div>Loading...</div>
  }

  const progress = getProgress()
  const todaysReading = getTodaysReading()
  const avgDaily = getAverageDaily()
  const { historicalDays, currentPaceDays } = predictCompletion()
  const { historicalDate, currentPaceDate } = getCompletionDates()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <BookOpen className="h-8 w-8 text-primary mt-1" />
            <div>
              <h1 className="text-3xl font-bold text-balance">{book.title}</h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Progress Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reading Progress</CardTitle>
              <CardDescription>Your current progress through the book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Pages Read</span>
                  <span>
                    {book.currentPage} / {book.totalPages}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="text-sm text-muted-foreground mt-1">
                  {progress.toFixed(1)}% complete • {book.totalPages - book.currentPage} pages remaining
                </div>
              </div>

              <div className="flex gap-2">
                {todaysReading > 0 && <Badge variant="secondary">Today: {todaysReading} pages</Badge>}
                {avgDaily > 0 && <Badge variant="outline">Avg: {avgDaily.toFixed(1)} pages/day</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Today's Reading</CardTitle>
              <CardDescription>Add pages to today's total (multiple entries will be added together)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pages">Pages Read</Label>
                <Input
                  id="pages"
                  type="number"
                  value={todaysPages}
                  onChange={(e) => setTodaysPages(e.target.value)}
                  placeholder="Enter pages read"
                  min="0"
                />
              </div>
              <Button onClick={updateTodaysReading} className="w-full">
                Add to Today's Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Completion Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completion Predictions
            </CardTitle>
            <CardDescription>Smart predictions based on your reading patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {historicalDays && historicalDate && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-chart-1" />
                    <span className="font-medium">Based on Reading History</span>
                  </div>
                  <div className="text-2xl font-bold text-chart-1">{historicalDays} days</div>
                  <div className="text-sm text-muted-foreground">
                    Expected completion:{" "}
                    {historicalDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              {currentPaceDays && currentPaceDate && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-chart-2" />
                    <span className="font-medium">At Today's Pace</span>
                  </div>
                  <div className="text-2xl font-bold text-chart-2">{currentPaceDays} days</div>
                  <div className="text-sm text-muted-foreground">
                    Expected completion:{" "}
                    {currentPaceDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reading Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Reading Chart</CardTitle>
            <CardDescription>Your reading progress over time (0 pages on days you didn't read)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload
                        return new Date(data.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }
                      return label
                    }}
                    formatter={(value: number) => [`${value} pages`, "Pages Read"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pages"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
