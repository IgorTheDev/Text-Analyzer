import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useData } from "@/lib/dataContext";
import { Wallet, CreditCard, Landmark, DollarSign, Plus, Pencil, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Account, AccountType } from "@/lib/mockData";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Accounts() {
  const { accounts, addAccount, updateAccount, deleteAccount, transactions, categories, currentUser } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [currency, setCurrency] = useState("RUB");
  const [historyAccount, setHistoryAccount] = useState<Account | null>(null);

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

  const handleSubmit = async () => {
    if (!currentUser?.familyId) {
      toast({
        title: "Семья не найдена",
        description: "Для создания счетов необходимо создать или присоединиться к семье.",
        variant: "destructive"
      });
      return;
    }

    try {
      const numBalance = parseFloat(balance);
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name,
          balance: isNaN(numBalance) ? 0 : numBalance,
          type,
          color
        });
        toast({
          title: "Счет обновлен",
          description: `Счет "${name}" был успешно обновлен.`,
        });
      } else {
        await addAccount({
          name,
          balance: isNaN(numBalance) ? 0 : numBalance,
          type,
          currency: currency,
          color
        });
        toast({
          title: "Счет создан",
          description: `Счет "${name}" был успешно создан.`,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить счет. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
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
                <Label>Баланс ({currency})</Label>
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Валюта</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">Рубль (RUB)</SelectItem>
                    <SelectItem value="USD">Доллар (USD)</SelectItem>
                    <SelectItem value="EUR">Евро (EUR)</SelectItem>
                    <SelectItem value="GBP">Фунт (GBP)</SelectItem>
                    <SelectItem value="CNY">Юань (CNY)</SelectItem>
                  </SelectContent>
                </Select>
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
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(acc)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить счет?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Все транзакции, связанные с этим счетом, будут удалены.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            try {
                              await deleteAccount(acc.id);
                              toast({
                                title: "Счет удален",
                                description: `Счет "${acc.name}" был успешно удален.`,
                                variant: "destructive"
                              });
                            } catch (error) {
                              toast({
                                title: "Ошибка",
                                description: "Не удалось удалить счет. Попробуйте еще раз.",
                                variant: "destructive"
                              });
                            }
                          }} className="bg-destructive hover:bg-destructive/90">
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Текущий баланс</p>
                    <h3 className={`text-3xl font-heading font-bold ${acc.balance < 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      {acc.balance.toLocaleString()} {getCurrencySymbol(acc.currency)}
                    </h3>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setHistoryAccount(acc)}>
                          <History className="h-4 w-4 mr-2" /> История
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>История транзакций: {acc.name}</DialogTitle>
                          <DialogDescription>
                            Все транзакции, связанные с этим счетом
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Описание</TableHead>
                                <TableHead>Категория</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead className="text-right">Сумма</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions
                                .filter(t => t.accountId === acc.id)
                                .map((t) => {
                                  const category = categories.find(c => c.id === t.categoryId);
                                  const isExpense = t.type === 'expense';

                                  return (
                                    <TableRow key={t.id}>
                                      <TableCell className="font-medium text-muted-foreground">
                                        {format(new Date(t.date), "d MMM yyyy", { locale: ru })}
                                      </TableCell>
                                      <TableCell className="font-medium">{t.description}</TableCell>
                                      <TableCell>
                                                        <div className="flex items-center gap-2">
                                                          <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: category?.color || '#94a3b8' }}
                                                          />
                                                          <span className="text-sm">{category?.name || 'Без категории'}</span>
                                                        </div>
                                      </TableCell>
                                      <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'expense' ? 'bg-red-100 text-red-800' : t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                          {t.type === 'expense' ? 'Расход' : t.type === 'income' ? 'Доход' : 'Перевод'}
                                                        </span>
                                      </TableCell>
                    <TableCell className={`text-right font-medium ${isExpense ? '' : 'text-emerald-600'}`}>
                                                        {isExpense ? '-' : '+'}{getCurrencySymbol(acc.currency)}{Number(t.amount).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                          {transactions.filter(t => t.accountId === acc.id).length === 0 && (
                            <div className="py-8 text-center text-muted-foreground">
                              Нет транзакций для этого счета
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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
