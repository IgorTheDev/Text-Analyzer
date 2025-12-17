import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useData } from "@/lib/dataContext";
import { Wallet, CreditCard, Landmark, DollarSign, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Account, AccountType } from "@/lib/mockData";

export default function Accounts() {
  const { accounts, addAccount, updateAccount } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [color, setColor] = useState("#3b82f6");

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setName("");
    setBalance("");
    setType("checking");
    setColor("#3b82f6");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setType(acc.type);
    setColor(acc.color);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const numBalance = parseFloat(balance);
    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name,
        balance: isNaN(numBalance) ? 0 : numBalance,
        type,
        color
      });
    } else {
      addAccount({
        name,
        balance: isNaN(numBalance) ? 0 : numBalance,
        type,
        currency: "RUB",
        familyId: "f1",
        color
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Счета</h1>
            <p className="text-muted-foreground mt-1">Обзор ваших финансовых активов и обязательств.</p>
          </div>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Добавить счет
          </Button>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Редактировать счет" : "Создать счет"}</DialogTitle>
              <DialogDescription>
                {editingAccount ? "Измените параметры счета." : "Добавьте новый счет для отслеживания."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Основной, Наличные" />
              </div>
              <div className="space-y-2">
                <Label>Баланс (₽)</Label>
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Расчетный</SelectItem>
                    <SelectItem value="savings">Сберегательный</SelectItem>
                    <SelectItem value="credit">Кредитный</SelectItem>
                    <SelectItem value="cash">Наличные</SelectItem>
                    <SelectItem value="investment">Инвестиции</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex gap-2">
                  {["#3b82f6", "#10b981", "#f59e0b", "#64748b", "#ef4444", "#8b5cf6", "#ec4899"].map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>

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
                  <div className="flex-1">
                    <CardTitle className="text-lg">{acc.name}</CardTitle>
                    <CardDescription className="capitalize">
                        {acc.type === 'credit' && 'Кредитный'}
                        {acc.type === 'cash' && 'Наличные'}
                        {acc.type === 'savings' && 'Сберегательный'}
                        {acc.type === 'checking' && 'Расчетный'}
                        {acc.type === 'investment' && 'Инвестиционный'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(acc)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Текущий баланс</p>
                    <h3 className={`text-3xl font-heading font-bold ${acc.balance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      {acc.balance.toLocaleString()} ₽
                    </h3>
                  </div>
                  <div className="mt-6 flex gap-2">
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
