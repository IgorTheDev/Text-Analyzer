import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/dataContext";
import { format } from "date-fns";
import { Search, Filter, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useToast } from "@/hooks/use-toast";
import { ru } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const { toast } = useToast();
  const { transactions, categories, accounts, deleteTransaction } = useData();

  const handleTxSuccess = () => {
    setIsNewTxOpen(false);
    toast({
      title: "Операция добавлена",
      description: "Ваша операция была успешно сохранена.",
    });
  };

  const getCategory = (id?: string) => categories.find(c => c.id === id);
  const getAccount = (id: string) => accounts.find(a => a.id === id);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Транзакции</h1>
            <p className="text-muted-foreground mt-1">Управление расходами семьи.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Экспорт
            </Button>
            
            <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "Редактировать операцию" : "Добавить операцию"}</DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? "Редактировать существующую операцию." : "Добавить новый расход, доход или перевод."}
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm onSuccess={handleTxSuccess} transaction={editingTransaction} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Все транзакции</CardTitle>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Категория" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Счет</TableHead>
                    <TableHead>Добавил</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => {
                      const category = getCategory(t.categoryId);
                      const account = getAccount(t.accountId);
                      const isExpense = t.type === 'expense';

                      return (
                    <TableRow key={t.id} className="group hover:bg-muted/50 transition-colors">
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
                      <TableCell className="text-muted-foreground">{account?.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{(t as any).createdByName || 'Неизвестный'}</TableCell>
                      <TableCell className={`text-right font-medium ${isExpense ? '' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'}{account?.currency === 'RUB' ? '₽' : '$'}{Number(t.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingTransaction(t);
                              setIsNewTxOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить операцию</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите удалить эту операцию? Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={async () => {
                                    try {
                                      await deleteTransaction(t.id);
                                      toast({
                                        title: "Операция удалена",
                                        description: "Ваша операция была успешно удалена.",
                                        variant: "destructive"
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Ошибка",
                                        description: "Не удалось удалить операцию. Попробуйте еще раз.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Ничего не найдено.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => {
                  const category = getCategory(t.categoryId);
                  const account = getAccount(t.accountId);
                  const isExpense = t.type === 'expense';

                  return (
                    <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category?.color || '#94a3b8' }}
                            />
                            <span className="text-sm text-muted-foreground truncate">{category?.name || 'Без категории'}</span>
                          </div>
                          <h3 className="font-medium text-foreground mb-1 truncate">{t.description}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>{format(new Date(t.date), "d MMM yyyy", { locale: ru })}</span>
                            <span>•</span>
                            <span className="truncate">{account?.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            Добавил: {(t as any).createdByName || 'Неизвестный'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className={`text-lg font-bold ${isExpense ? 'text-foreground' : 'text-emerald-600'}`}>
                            {isExpense ? '-' : '+'}{account?.currency === 'RUB' ? '₽' : '$'}{Number(t.amount).toFixed(2)}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 touch-target touch-feedback"
                              onClick={() => {
                                setEditingTransaction(t);
                                setIsNewTxOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 touch-target touch-feedback text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить операцию</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите удалить эту операцию? Это действие нельзя отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={async () => {
                                      try {
                                        await deleteTransaction(t.id);
                                        toast({
                                          title: "Операция удалена",
                                          description: "Ваша операция была успешно удалена.",
                                          variant: "destructive"
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Ошибка",
                                          description: "Не удалось удалить операцию. Попробуйте еще раз.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ничего не найдено.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
