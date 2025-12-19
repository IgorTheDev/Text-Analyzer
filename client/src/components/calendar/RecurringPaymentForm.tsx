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
import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useData } from "@/lib/dataContext";
import { RecurringPayment } from "@/lib/mockData";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Введите название"),
  amount: z.string().min(1, "Введите сумму"),
  frequency: z.enum(["monthly", "semi_annual", "annual"]),
  startDate: z.string().min(1, "Выберите дату начала"),
  type: z.enum(["payment", "debt", "loan"]),
});

type Props = {
  onSuccess?: () => void;
  initialData?: RecurringPayment;
};

export function RecurringPaymentForm({ onSuccess, initialData }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { addRecurringPayment, updateRecurringPayment, deleteRecurringPayment } = useData();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      amount: initialData?.amount.toString() || "",
      frequency: initialData?.frequency || "monthly",
      startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      type: initialData?.type || "payment",
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        amount: initialData.amount.toString(),
        frequency: initialData.frequency,
        startDate: initialData.startDate,
        type: initialData.type,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const paymentData = {
        name: values.name,
        amount: parseFloat(values.amount),
        frequency: values.frequency,
        startDate: values.startDate,
        type: values.type,
      };

      if (initialData) {
        await updateRecurringPayment(initialData.id, paymentData);
        toast({
          title: "Платеж обновлен",
          description: `Платеж "${values.name}" был успешно обновлен.`,
        });
      } else {
        await addRecurringPayment(paymentData);
        toast({
          title: "Платеж создан",
          description: `Платеж "${values.name}" был успешно создан.`,
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить платеж. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип платежа</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="payment">Обязательный платеж</SelectItem>
                  <SelectItem value="debt">Долг (мне/я)</SelectItem>
                  <SelectItem value="loan">Кредит</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="напр. Аренда, Кредит за авто" {...field} />
              </FormControl>
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
                    <Input placeholder="0.00" {...field} className="pl-7" type="number" step="0.01" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата начала</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Периодичность</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите период" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Каждый месяц</SelectItem>
                  <SelectItem value="semi_annual">Раз в полгода</SelectItem>
                  <SelectItem value="annual">Раз в год</SelectItem>
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
            initialData ? "Сохранить изменения" : "Добавить платеж"
          )}
        </Button>

        {initialData && (
          <div className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" /> Удалить платеж
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить регулярный платеж?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Все данные о платеже будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        await deleteRecurringPayment(initialData.id);
                        toast({
                          title: "Платеж удален",
                          description: `Регулярный платеж "${initialData.name}" был успешно удален.`,
                          variant: "destructive"
                        });
                        if (onSuccess) onSuccess();
                      } catch (error) {
                        toast({
                          title: "Ошибка",
                          description: "Не удалось удалить платеж. Попробуйте еще раз.",
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
        )}
      </form>
    </Form>
  );
}
