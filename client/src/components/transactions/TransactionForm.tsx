import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/dataContext";
import { useState, useEffect } from "react";
import { Loader2, Calculator, Plus, Minus, X, Divide } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  description: z.string().min(2, "Введите описание"),
  amount: z.string().min(1, "Введите сумму"), // using string for input handling then parsing
  type: z.enum(["expense", "income", "transfer"]),
  categoryId: z.string().optional(),
  accountId: z.string().min(1, "Выберите счет"),
  date: z.string().min(1, "Выберите дату"),
});

export function TransactionForm({ onSuccess, transaction }: { onSuccess?: () => void, transaction?: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrevious, setCalcPrevious] = useState<number | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);
  const { addTransaction, updateTransaction, accounts, categories } = useData();

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction?.amount?.toString() || "",
      type: transaction?.type || "expense",
      categoryId: transaction?.categoryId || undefined,
      accountId: transaction?.accountId || accounts[0]?.id,
      date: transaction?.date || new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (transaction) {
        // Update existing transaction
        await updateTransaction(transaction.id, {
          description: values.description,
          amount: parseFloat(values.amount),
          type: values.type,
          categoryId: values.categoryId,
          accountId: values.accountId,
          date: values.date,
        });
      } else {
        // Add new transaction
        await addTransaction({
          description: values.description,
          amount: parseFloat(values.amount),
          type: values.type,
          categoryId: values.categoryId,
          accountId: values.accountId,
          date: values.date,
        });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const type = form.watch("type");

  // Calculator functions
  const calcInputNumber = (num: string) => {
    if (calcDisplay === "0") {
      setCalcDisplay(num);
    } else {
      setCalcDisplay(calcDisplay + num);
    }
  };

  const calcInputOperation = (op: string) => {
    if (calcPrevious === null) {
      setCalcPrevious(parseFloat(calcDisplay));
      setCalcOperation(op);
      setCalcDisplay("0");
    } else if (calcOperation) {
      const current = parseFloat(calcDisplay);
      const result = calculate(calcPrevious, current, calcOperation);
      setCalcDisplay(result.toString());
      setCalcPrevious(result);
      setCalcOperation(op);
    }
  };

  const calculate = (first: number, second: number, operation: string) => {
    switch (operation) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        return second !== 0 ? first / second : 0;
      default:
        return second;
    }
  };

  const calcEquals = () => {
    if (calcPrevious !== null && calcOperation) {
      const current = parseFloat(calcDisplay);
      const result = calculate(calcPrevious, current, calcOperation);
      setCalcDisplay(result.toString());
      setCalcPrevious(null);
      setCalcOperation(null);
    }
  };

  const calcClear = () => {
    setCalcDisplay("0");
    setCalcPrevious(null);
    setCalcOperation(null);
  };

  const applyCalcResult = () => {
    form.setValue("amount", calcDisplay);
    setShowCalculator(false);
  };

  // Keyboard support for calculator
  useEffect(() => {
    if (!showCalculator) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default behavior for calculator keys when calculator is open
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '=', 'Enter', 'Escape', 'Backspace'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key >= '0' && e.key <= '9') {
        calcInputNumber(e.key);
      } else if (e.key === '.') {
        calcInputNumber('.');
      } else if (e.key === '+') {
        calcInputOperation('+');
      } else if (e.key === '-') {
        calcInputOperation('-');
      } else if (e.key === '*') {
        calcInputOperation('*');
      } else if (e.key === '/') {
        calcInputOperation('/');
      } else if (e.key === '=' || e.key === 'Enter') {
        calcEquals();
      } else if (e.key === 'Escape') {
        calcClear();
      } else if (e.key === 'Backspace') {
        // Remove last character from display
        if (calcDisplay.length > 1) {
          setCalcDisplay(calcDisplay.slice(0, -1));
        } else {
          setCalcDisplay('0');
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showCalculator, calcDisplay]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
          <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₽</span>
                    <Input placeholder="0.00" {...field} className="pl-7 pr-10" type="number" step="0.01" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => setShowCalculator(!showCalculator)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showCalculator && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold bg-muted p-2 rounded">
                    {calcDisplay}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[7, 8, 9, "/"].map((btn) => (
                    <Button
                      key={btn}
                      type="button"
                      variant={typeof btn === "string" ? "outline" : "secondary"}
                      className="h-12"
                      onClick={() => typeof btn === "string" ? calcInputOperation(btn) : calcInputNumber(btn.toString())}
                    >
                      {typeof btn === "string" ? <Divide className="h-4 w-4" /> : btn}
                    </Button>
                  ))}

                  {[4, 5, 6, "*"].map((btn) => (
                    <Button
                      key={btn}
                      type="button"
                      variant={typeof btn === "string" ? "outline" : "secondary"}
                      className="h-12"
                      onClick={() => typeof btn === "string" ? calcInputOperation(btn) : calcInputNumber(btn.toString())}
                    >
                      {typeof btn === "string" ? <X className="h-4 w-4" /> : btn}
                    </Button>
                  ))}

                  {[1, 2, 3, "-"].map((btn) => (
                    <Button
                      key={btn}
                      type="button"
                      variant={typeof btn === "string" ? "outline" : "secondary"}
                      className="h-12"
                      onClick={() => typeof btn === "string" ? calcInputOperation(btn) : calcInputNumber(btn.toString())}
                    >
                      {typeof btn === "string" ? <Minus className="h-4 w-4" /> : btn}
                    </Button>
                  ))}

                  <Button type="button" variant="secondary" className="h-12" onClick={() => calcInputNumber("0")}>
                    0
                  </Button>
                  <Button type="button" variant="secondary" className="h-12" onClick={() => calcInputNumber(".")}>
                    .
                  </Button>
                  <Button type="button" variant="outline" className="h-12" onClick={calcEquals}>
                    =
                  </Button>
                  <Button type="button" variant="outline" className="h-12" onClick={() => calcInputOperation("+")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={calcClear}>
                    C
                  </Button>
                  <Button type="button" className="flex-1" onClick={applyCalcResult}>
                    Применить результат
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Input placeholder="напр. Супермаркет" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type !== "transfer" && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories
                      .filter(c => (type === 'expense' || type === 'income') && c.type === type)
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Счет</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счет" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({getCurrencySymbol(a.currency)}{a.balance})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...
            </>
          ) : (
            "Сохранить"
          )}
        </Button>
      </form>
    </Form>
  );
}
