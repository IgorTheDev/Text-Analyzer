import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { accounts } from "@/lib/mockData";
import { Wallet, CreditCard, Landmark, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Accounts() {
  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Счета</h1>
            <p className="text-muted-foreground mt-1">Обзор ваших финансовых активов и обязательств.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Добавить счет
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = acc.type === 'credit' ? CreditCard : acc.type === 'cash' ? DollarSign : acc.type === 'savings' ? Landmark : Wallet;
            return (
              <Card key={acc.id} className="relative overflow-hidden group">
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2" 
                  style={{ backgroundColor: acc.color }}
                />
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{acc.name}</CardTitle>
                    <CardDescription className="capitalize">
                        {acc.type === 'credit' && 'Кредитный'}
                        {acc.type === 'cash' && 'Наличные'}
                        {acc.type === 'savings' && 'Сберегательный'}
                        {acc.type === 'checking' && 'Расчетный'}
                        {acc.type === 'investment' && 'Инвестиционный'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Текущий баланс</p>
                    <h3 className={`text-3xl font-heading font-bold ${acc.balance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full">Изменить</Button>
                    <Button variant="outline" size="sm" className="w-full">История</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
