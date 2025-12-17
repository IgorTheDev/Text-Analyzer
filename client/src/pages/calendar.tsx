import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, getDay, getDate, getMonth, addMonths as addMonthsFn } from "date-fns";
import { useState } from "react";
import { transactions, recurringPayments, RecurringPayment } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RecurringPaymentForm } from "@/components/calendar/RecurringPaymentForm";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const { toast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days for the start of the month (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handlePaymentSuccess = () => {
    setIsNewPaymentOpen(false);
    toast({
      title: "Платеж добавлен",
      description: "Обязательный платеж успешно добавлен в календарь.",
    });
  };

  // Helper to check if a recurring payment occurs on a specific date
  const getRecurringForDay = (date: Date) => {
    return recurringPayments.filter(rp => {
      const start = new Date(rp.startDate);
      const dayToCheck = getDate(date);
      const monthToCheck = getMonth(date);
      const startDay = getDate(start);
      const startMonth = getMonth(start);

      // Simple check: matches day of month
      if (dayToCheck !== startDay) return false;

      // Check start date is before or equal to current date
      if (date < start) return false;

      if (rp.frequency === 'monthly') {
        return true;
      } else if (rp.frequency === 'semi_annual') {
        // Check if month difference is multiple of 6
        const monthDiff = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
        return monthDiff % 6 === 0;
      } else if (rp.frequency === 'annual') {
         // Check if month matches
         return monthToCheck === startMonth;
      }
      return false;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Календарь</h1>
            <p className="text-muted-foreground mt-1">Предстоящие платежи и история.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="w-32 text-center font-medium text-lg capitalize">{format(currentMonth, "LLLL yyyy", { locale: ru })}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            
            <Dialog open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen}>
              <DialogTrigger asChild>
                <Button className="ml-4 gap-2">
                  <Plus className="h-4 w-4" /> Платеж
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Добавить обязательный платеж</DialogTitle>
                  <DialogDescription>
                    Настройте регулярные платежи, кредиты или долги.
                  </DialogDescription>
                </DialogHeader>
                <RecurringPaymentForm onSuccess={handlePaymentSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-[600px] shadow-sm">
          <CardHeader className="pb-2 border-b">
            <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
              {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
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
                const dayScheduled = getRecurringForDay(day);
                
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
                        <div key={s.id} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-opacity-20 truncate font-medium text-primary-foreground border-l-2 border-opacity-50 flex justify-between items-center"
                             style={{ backgroundColor: s.color || '#6366f1', borderColor: s.color || '#6366f1' }}>
                          <span className="truncate mr-1">{s.name}</span>
                          <span>${s.amount}</span>
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
