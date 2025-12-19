import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, isSameDay, getDay, getDate, getMonth } from "date-fns";
import { useState } from "react";
import { useData } from "@/lib/dataContext";
import { RecurringPayment, Transaction } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RecurringPaymentForm } from "@/components/calendar/RecurringPaymentForm";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'payment' | 'transaction', data: RecurringPayment | Transaction } | null>(null);
  const { toast } = useToast();
  const { transactions, recurringPayments, deleteRecurringPayment } = useData();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = getDay(monthStart);
  // Fix for Russian week starting on Monday (0 is Sunday in date-fns, but we want Monday start visually if needed, but standard calendar often starts Sunday. Let's stick to standard Sunday start for simplicity or adjust if needed. Russian calendars usually start Monday.
  // getDay returns 0 for Sunday. If we want Monday start: (day + 6) % 7.
  // Let's stick to Sunday start for layout consistency with typical date-fns logic unless asked specifically.
  const paddingDays = Array.from({ length: startDayOfWeek });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handlePaymentSuccess = () => {
    setIsNewPaymentOpen(false);
    setSelectedItem(null);
    toast({
      title: "Успешно",
      description: "Данные календаря обновлены.",
    });
  };

  const getRecurringForDay = (date: Date) => {
    return recurringPayments.filter(rp => {
      const start = new Date(rp.startDate);
      const dayToCheck = getDate(date);
      const monthToCheck = getMonth(date);
      const startDay = getDate(start);
      const startMonth = getMonth(start);

      if (dayToCheck !== startDay) return false;

      // Normalize dates to start of day for comparison
      const dateNormalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());

      if (dateNormalized < startNormalized) return false;

      if (rp.frequency === 'monthly') {
        // Monthly payments occur every month on the same day
        return true;
      } else if (rp.frequency === 'semi_annual') {
        // Semi-annual payments occur every 6 months
        const monthDiff = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
        return monthDiff % 6 === 0;
      } else if (rp.frequency === 'annual') {
        // Annual payments occur every year on the same month and day
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

            {/* Edit Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedItem?.type === 'payment' ? 'Редактировать платеж' : 'Детали транзакции'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedItem?.type === 'payment' 
                      ? 'Измените параметры регулярного платежа.' 
                      : 'Информация о совершенной операции.'}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedItem?.type === 'payment' ? (
                  <RecurringPaymentForm 
                    initialData={selectedItem.data as RecurringPayment} 
                    onSuccess={handlePaymentSuccess} 
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Описание</span>
                      <span className="font-medium">{(selectedItem?.data as Transaction)?.description}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Сумма</span>
                      <span className={`font-medium ${(selectedItem?.data as Transaction)?.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(selectedItem?.data as Transaction)?.amount} ₽
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Дата</span>
                      <span className="font-medium">{format(new Date((selectedItem?.data as Transaction)?.date || new Date()), "d MMM yyyy", { locale: ru })}</span>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setSelectedItem(null)}>Закрыть</Button>
                  </div>
                )}
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
              {paddingDays.map((_, i) => (
                <div key={`padding-${i}`} className="border-b border-r bg-muted/5 min-h-[100px]" />
              ))}

              {daysInMonth.map((day, i) => {
                const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
                const dayScheduled = getRecurringForDay(day);
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "min-h-[100px] border-b border-r p-2 hover:bg-muted/30 transition-colors relative group flex flex-col gap-1",
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
                        <div 
                          key={s.id} 
                          onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'payment', data: s }); }}
                          className="text-[10px] px-1.5 py-0.5 rounded-sm bg-opacity-20 truncate font-medium text-primary-foreground border-l-2 border-opacity-50 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: s.color || '#6366f1', borderColor: s.color || '#6366f1' }}
                        >
                          <span className="truncate mr-1">{s.name}</span>
                          <span>{s.amount}₽</span>
                        </div>
                      ))}
                      {dayTransactions.map(t => (
                        <div 
                          key={t.id} 
                          onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'transaction', data: t }); }}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-sm truncate flex justify-between cursor-pointer hover:opacity-80 transition-opacity",
                            t.type === 'expense' ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                          )}
                        >
                          <span className="truncate mr-1">{t.description}</span>
                          <span>{t.type === 'expense' ? '-' : '+'}{Math.round(t.amount)}₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
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
