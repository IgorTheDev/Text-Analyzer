import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, getDay } from "date-fns";
import { useState } from "react";
import { transactions } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days for the start of the month (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek });

  // Simple mock schedule for recurring payments
  const scheduledPayments = [
    { id: "s1", day: 1, name: "Rent", amount: 1200, color: "#8b5cf6" },
    { id: "s2", day: 15, name: "Netflix", amount: 15, color: "#ec4899" },
    { id: "s3", day: 25, name: "Internet", amount: 90, color: "#6366f1" },
  ];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground mt-1">View upcoming bills and payment history.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="w-32 text-center font-medium text-lg">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-[600px] shadow-sm">
          <CardHeader className="pb-2 border-b">
            <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="grid grid-cols-7 h-full">
              {/* Empty cells for padding */}
              {paddingDays.map((_, i) => (
                <div key={`padding-${i}`} className="border-b border-r bg-muted/5 min-h-[100px]" />
              ))}

              {/* Actual days */}
              {daysInMonth.map((day, i) => {
                const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
                const dayScheduled = scheduledPayments.filter(s => s.day === day.getDate());
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "min-h-[100px] border-b border-r p-2 hover:bg-muted/30 transition-colors cursor-pointer relative group flex flex-col gap-1",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                      isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground group-hover:bg-muted"
                    )}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[120px] scrollbar-none">
                      {dayScheduled.map(s => (
                        <div key={s.id} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-opacity-20 truncate font-medium text-primary-foreground border-l-2 border-opacity-50"
                             style={{ backgroundColor: s.color, borderColor: s.color }}>
                          {s.name} ${s.amount}
                        </div>
                      ))}
                      {dayTransactions.map(t => (
                        <div key={t.id} className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-sm truncate flex justify-between",
                          t.type === 'expense' ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          <span className="truncate mr-1">{t.description}</span>
                          <span>{t.type === 'expense' ? '-' : '+'}${Math.round(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Add trailing empty cells if needed to complete the grid row (optional but looks nicer) */}
              {Array.from({ length: (7 - (daysInMonth.length + paddingDays.length) % 7) % 7 }).map((_, i) => (
                 <div key={`trailing-${i}`} className="border-b border-r bg-muted/5 min-h-[100px]" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
