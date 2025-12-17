import { useState } from "react";
import { useLocation } from "wouter";
import { useData } from "@/lib/dataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";

export default function AuthPage() {
  const [username, setUsername] = useState("alex_doe");
  const [password, setPassword] = useState("");
  const { login } = useData();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-heading">FamilyFinance</CardTitle>
          <CardDescription>
            Войдите, чтобы управлять семейным бюджетом
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input 
                id="username" 
                placeholder="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Войти
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Нет аккаунта? &nbsp;<span className="text-primary hover:underline cursor-pointer">Регистрация</span>
        </CardFooter>
      </Card>
    </div>
  );
}
