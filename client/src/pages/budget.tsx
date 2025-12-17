import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/dataContext";
import { Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Budget() {
  const { categories, transactions, updateCategoryLimit } = useData();
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<string>("");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate actual spending
  const getSpending = (categoryId: string) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.categoryId === categoryId && 
               t.type === 'expense' &&
               d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
  const totalSpent = expenseCategories.reduce((sum, c) => sum + getSpending(c.id), 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleUpdateLimit = (id: string) => {
    const limit = parseFloat(newLimit);
    if (!isNaN(limit)) {
      updateCategoryLimit(id, limit);
      setEditingCategory(null);
      setNewLimit("");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Бюджет</h1>
            <p className="text-muted-foreground mt-1">Контроль ежемесячных лимитов.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {expenseCategories.map(cat => {
            const limit = cat.budgetLimit || 0;
            const spent = getSpending(cat.id);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            return (
              <Card key={cat.id} className={`overflow-hidden border-l-4`} style={{ borderLeftColor: cat.color }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {cat.name}
                      </CardTitle>
                      <CardDescription>Лимит: {limit} ₽</CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNewLimit(limit.toString())}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Изменить лимит для "{cat.name}"</DialogTitle>
                            <DialogDescription>Установите новый ежемесячный лимит расходов.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Сумма лимита (₽)</Label>
                              <Input 
                                type="number" 
                                value={newLimit} 
                                onChange={(e) => setNewLimit(e.target.value)} 
                              />
                            </div>
                            <Button onClick={() => handleUpdateLimit(cat.id)}>Сохранить</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {isOverBudget ? (
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-2 flex justify-between text-sm font-medium">
                    <span>{spent} ₽</span>
                    <span className={isOverBudget ? "text-rose-600" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                </CardContent>
                <CardFooter className="pt-2 text-xs text-muted-foreground">
                  {isOverBudget ? (
                    <span className="text-rose-600 font-medium">Превышение на {spent - limit} ₽</span>
                  ) : (
                    <span>{limit - spent} ₽ осталось</span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Total Summary */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-bold">Общий статус бюджета</h3>
              <p className="text-primary-foreground/80 max-w-md">
                Вы потратили {totalPercentage.toFixed(0)}% от общего бюджета на этот месяц. 
                {totalPercentage > 100 
                  ? "Общий бюджет превышен, постарайтесь сократить расходы." 
                  : "Так держать, вы укладываетесь в рамки!"}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <div className="text-sm opacity-80">Общий лимит</div>
                <div className="text-xl font-bold">{totalBudget.toLocaleString()} ₽</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-sm opacity-80">Всего потрачено</div>
                <div className="text-xl font-bold">{totalSpent.toLocaleString()} ₽</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
