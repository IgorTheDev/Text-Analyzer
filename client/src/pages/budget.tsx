import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/mockData";
import { Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Budget() {
  const expenseCategories = categories.filter(c => c.type === 'expense');
  
  // Mock spending data relative to budget
  const getSpending = (limit: number) => {
    // Randomize spending between 30% and 110% of limit for demo
    return Math.floor(limit * (0.3 + Math.random() * 0.8));
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Budget Plan</h1>
            <p className="text-muted-foreground mt-1">Track your monthly spending limits.</p>
          </div>
          <Button className="gap-2">
            <Pencil className="h-4 w-4" /> Edit Budget
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {expenseCategories.map(cat => {
            const limit = cat.budgetLimit || 500;
            const spent = getSpending(limit);
            const percentage = (spent / limit) * 100;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > 85 && percentage <= 100;

            return (
              <Card key={cat.id} className={`overflow-hidden border-l-4`} style={{ borderLeftColor: cat.color }}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {cat.name}
                      </CardTitle>
                      <CardDescription>Monthly Limit: ${limit}</CardDescription>
                    </div>
                    {isOverBudget ? (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-2 flex justify-between text-sm font-medium">
                    <span>${spent} spent</span>
                    <span className={isOverBudget ? "text-rose-600" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                    // We can't easily style the indicator color directly via props in standard shadcn, 
                    // but we can rely on the default primary color or use custom CSS.
                    // For now, let's just use the default.
                  />
                </CardContent>
                <CardFooter className="pt-2 text-xs text-muted-foreground">
                  {isOverBudget ? (
                    <span className="text-rose-600 font-medium">You've exceeded your budget by ${spent - limit}</span>
                  ) : (
                    <span>${limit - spent} remaining this month</span>
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
              <h3 className="text-2xl font-heading font-bold">Total Budget Status</h3>
              <p className="text-primary-foreground/80 max-w-md">
                You have spent 72% of your total allocated budget for this month. 
                Keep it up to reach your savings goals!
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <div className="text-sm opacity-80">Total Limit</div>
                <div className="text-xl font-bold">$3,450</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-sm opacity-80">Total Spent</div>
                <div className="text-xl font-bold">$2,480</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
