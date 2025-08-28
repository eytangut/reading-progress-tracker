"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Plus, Moon, Sun, TrendingUp, Calendar, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
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

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newBook, setNewBook] = useState({ title: "", author: "", totalPages: "", currentPage: "" })
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const savedBooks = localStorage.getItem("reading-tracker-books")
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks))
    }
  }, [])

  const saveBooks = (updatedBooks: Book[]) => {
    setBooks(updatedBooks)
    localStorage.setItem("reading-tracker-books", JSON.stringify(updatedBooks))
  }

  const addBook = () => {
    if (!newBook.title || !newBook.author || !newBook.totalPages) return

    const book: Book = {
      id: Date.now().toString(),
      title: newBook.title,
      author: newBook.author,
      totalPages: Number.parseInt(newBook.totalPages),
      currentPage: newBook.currentPage ? Number.parseInt(newBook.currentPage) : 0,
      dailyReadings: {},
      createdAt: new Date().toISOString(),
    }

    saveBooks([...books, book])
    setNewBook({ title: "", author: "", totalPages: "", currentPage: "" })
    setIsAddDialogOpen(false)
  }

  const deleteBook = (bookId: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to book page
    e.stopPropagation()

    const updatedBooks = books.filter((book) => book.id !== bookId)
    saveBooks(updatedBooks)
  }

  const getProgress = (book: Book) => {
    return Math.min((book.currentPage / book.totalPages) * 100, 100)
  }

  const getTodaysReading = (book: Book) => {
    const today = new Date().toISOString().split("T")[0]
    return book.dailyReadings[today] || 0
  }

  const getAverageDaily = (book: Book) => {
    const readings = Object.values(book.dailyReadings).filter((pages) => pages > 0)
    if (readings.length === 0) return 0
    return readings.reduce((sum, pages) => sum + pages, 0) / readings.length
  }

  const predictCompletion = (book: Book) => {
    const remainingPages = book.totalPages - book.currentPage
    const avgDaily = getAverageDaily(book)
    const todaysReading = getTodaysReading(book)

    const historicalDays = avgDaily > 0 ? Math.ceil(remainingPages / avgDaily) : null
    const currentPaceDays = todaysReading > 0 ? Math.ceil(remainingPages / todaysReading) : null

    return { historicalDays, currentPaceDays }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Reading Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Add a book to start tracking your reading progress.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      placeholder="Enter book title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      placeholder="Enter author name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pages">Total Pages</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={newBook.totalPages}
                      onChange={(e) => setNewBook({ ...newBook, totalPages: e.target.value })}
                      placeholder="Enter total pages"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentPage">Current Page (optional)</Label>
                    <Input
                      id="currentPage"
                      type="number"
                      min="0"
                      value={newBook.currentPage}
                      onChange={(e) => setNewBook({ ...newBook, currentPage: e.target.value })}
                      placeholder="Enter current page (leave empty if starting from beginning)"
                    />
                  </div>
                  <Button onClick={addBook} className="w-full">
                    Add Book
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No books yet</h2>
            <p className="text-muted-foreground mb-4">Add your first book to start tracking your reading progress.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => {
              const progress = getProgress(book)
              const todaysReading = getTodaysReading(book)
              const { historicalDays, currentPaceDays } = predictCompletion(book)

              return (
                <div key={book.id} className="relative group">
                  <Link href={`/book/${book.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
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
                          <div className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% complete</div>
                        </div>

                        {todaysReading > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Today: {todaysReading} pages</Badge>
                          </div>
                        )}

                        <div className="space-y-2 text-xs text-muted-foreground">
                          {historicalDays && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>~{historicalDays} days (avg pace)</span>
                            </div>
                          )}
                          {currentPaceDays && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>~{currentPaceDays} days (today's pace)</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => deleteBook(book.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
