import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useData } from "@/lib/dataContext";
import { format, subDays } from "date-fns";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, CreditCard, Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ru } from "date-fns/locale";

export default function Dashboard() {
  const { transactions, accounts, categories } = useData();

  // Calculate real metrics
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const primaryCurrency = accounts.length > 0 ? accounts[0].currency : 'RUB';
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Chart data based on last 7 days transactions
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, "yyyy-MM-dd");
    const dayName = format(d, "EEE", { locale: ru });
    
    const dayTx = transactions.filter(t => t.date === dayStr);
    const expenses = dayTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const income = dayTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    return {
      name: dayName,
      expenses,
      income
    };
  });

  const getCategory = (id?: string) => categories.find(c => c.id === id);
  const getAccount = (id: string) => accounts.find(a => a.id === id);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'RUB': return '₽';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CNY': return '¥';
      default: return currency;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Главная</h1>
          <p className="text-muted-foreground mt-1">С возвращением! Вот обзор ваших финансов.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading">{totalBalance.toLocaleString()} {getCurrencySymbol(primaryCurrency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2.5% к прошлому месяцу
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доход за месяц</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-emerald-600">
                +{monthlyIncome.toLocaleString()} {getCurrencySymbol(primaryCurrency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                В планах на этот месяц
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Расходы за месяц</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-rose-600">
                -{monthlyExpenses.toLocaleString()} {getCurrencySymbol(primaryCurrency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                12% меньше, чем в прошлом месяце
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Норма сбережений</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-blue-600">
                {savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Цель: 20%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid gap-4 md:grid-cols-7">
          {/* Main Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Денежный поток</CardTitle>
              <CardDescription>Доходы и расходы за последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorExpenses)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Последние операции</CardTitle>
              <CardDescription>Последние 5 операций по всем счетам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {transactions.slice(0, 5).map((t) => {
                  const category = getCategory(t.categoryId);
                  const account = getAccount(t.accountId);
                  const isExpense = t.type === 'expense';
                  
                  return (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: category?.color || '#94a3b8' }}
                        >
                          {/* Use first letter of category or fallback */}
                          {category?.name?.[0] || 'T'}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "d MMM", { locale: ru })} • {account?.name}
                          </p>
                        </div>
                      </div>
                      <div className={`font-medium text-sm ${isExpense ? 'text-foreground' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'}{getCurrencySymbol(account?.currency || 'RUB')}{t.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Summary */}
        <div>
          <h2 className="text-xl font-heading font-semibold mb-4">Ваши счета</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {accounts.map(acc => (
              <Card key={acc.id} className="bg-card hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-secondary">
                      {acc.type === 'credit' ? <CreditCard className="h-5 w-5 text-foreground" /> : <Wallet className="h-5 w-5 text-foreground" />}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${acc.balance < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {acc.type === 'credit' ? 'Кредитный' : 'Активный'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{acc.name}</p>
                    <h3 className={`text-2xl font-bold font-heading ${acc.balance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      {acc.balance.toLocaleString()} {getCurrencySymbol(acc.currency)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
