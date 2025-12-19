import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  CalendarDays,
  PieChart,
  Settings,
  Menu,
  LogOut,
  Plus,
  Users,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useData } from "@/lib/dataContext";
import { useState } from "react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { label: "Главная", icon: LayoutDashboard, href: "/" },
  { label: "Транзакции", icon: CreditCard, href: "/transactions" },
  { label: "Бюджет", icon: Wallet, href: "/budget" },
  { label: "Календарь", icon: CalendarDays, href: "/calendar" },
  { label: "Счета", icon: PieChart, href: "/accounts" },
  { label: "Семья", icon: Users, href: "/family" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { currentUser, logout } = useData();
  const [, setLocation] = useLocation();

  const handleTxSuccess = () => {
    setIsNewTxOpen(false);
    toast.success("Операция добавлена");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-xl tracking-tight">FamilyFinance</h1>
        </div>
        
        <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
          <DialogTrigger asChild>
            <Button className="w-full justify-start gap-2 mb-6 font-medium shadow-md" size="lg">
              <Plus className="h-4 w-4" /> Новая операция
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить операцию</DialogTitle>
              <DialogDescription>
                Добавить новый расход, доход или перевод.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onSuccess={handleTxSuccess} />
          </DialogContent>
        </Dialog>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={currentUser?.avatar || ""} />
            <AvatarFallback>{currentUser?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.username || "User"}</p>
          </div>
        </div>

        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mb-2"
            >
              <User className="h-4 w-4" /> Профиль
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Настройки аккаунта</DialogTitle>
              <DialogDescription>
                Управление вашим аккаунтом и настройками
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Информация о пользователе</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Имя пользователя: {currentUser?.username}</p>
                  <p>Имя: {currentUser?.firstName} {currentUser?.lastName}</p>
                  <p>Роль: {currentUser?.role === "admin" ? "Администратор" : "Участник"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Опасные действия</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Удалить аккаунт
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Все ваши данные будут удалены, включая транзакции, счета и семейную информацию.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                          try {
                            await fetchApi("/api/account/delete", {
                              method: "DELETE",
                              body: JSON.stringify({
                                userId: currentUser?.id,
                              }),
                            });

                            toast.success("Ваш аккаунт успешно удален");
                            setIsProfileOpen(false);
                            logout();
                            setLocation("/auth");
                          } catch (error) {
                            toast.error("Ошибка удаления аккаунта: " + (error instanceof Error ? error.message : "Unknown error"));
                          }
                        }}
                      >
                        Удалить аккаунт
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => {
            logout();
            setLocation("/auth");
            toast.success("Выход выполнен");
          }}
        >
          <LogOut className="h-4 w-4" /> Выйти
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50" role="navigation" aria-label="Основная навигация">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col" role="main" aria-label="Основной контент">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg">FamilyFinance</span>
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
