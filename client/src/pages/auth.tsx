import { useState } from "react";
import { useLocation } from "wouter";
import { useData } from "@/lib/dataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

export default function AuthPage() {
  const [username, setUsername] = useState(() => localStorage.getItem("rememberedUsername") || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberedUsername") !== null);
  const { login } = useData();
  const [, setLocation] = useLocation();

  // Enhanced password policies
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 1; // Minimum 8 characters
    if (pwd.length >= 12) strength += 1; // Strong if 12+
    if (/[A-Z]/.test(pwd)) strength += 1; // Uppercase letter
    if (/[a-z]/.test(pwd)) strength += 1; // Lowercase letter
    if (/[0-9]/.test(pwd)) strength += 1; // Number
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1; // Special character
    return Math.min(strength, 5);
  };

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 6) errors.push("Пароль должен содержать минимум 6 символов");
    // For demo purposes, make password requirements less strict
    // if (!/[A-Z]/.test(pwd)) errors.push("Пароль должен содержать заглавную букву");
    // if (!/[a-z]/.test(pwd)) errors.push("Пароль должен содержать строчную букву");
    // if (!/[0-9]/.test(pwd)) errors.push("Пароль должен содержать цифру");
    // if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("Пароль должен содержать специальный символ");
    return errors;
  };

  const passwordStrength = getPasswordStrength(password);

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return 'Слабый';
    if (strength <= 4) return 'Средний';
    return 'Сильный';
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (!email.trim()) {
        toast.error("Пожалуйста, введите email");
        return;
      }

      // In a real app, this would call the API to send password reset email
      // For mock purposes, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success("Ссылка для сброса пароля отправлена на ваш email");
      setShowForgotPassword(false);
    } catch (error) {
      toast.error("Ошибка при отправке запроса на сброс пароля");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== LOGIN BUTTON CLICKED ===');
    console.log('Form data:', { username, password });
    try {
      // Basic validation
      if (!username.trim()) {
        toast.error("Пожалуйста, введите имя пользователя");
        return;
      }
      if (!password.trim()) {
        toast.error("Пожалуйста, введите пароль");
        return;
      }
      if (password.length < 6) {
        toast.error("Пароль должен содержать не менее 6 символов");
        return;
      }

      const data = await fetchApi("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('User data:', data.user);

      await login({
        id: data.user.id,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        familyId: data.user.familyId,
        role: data.user.role,
      });

      console.log('Login function completed, redirecting to /');
      setLocation("/");
      toast.success("Вход выполнен успешно!");
    } catch (error) {
      toast.error("Ошибка входа: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validation
      if (!username.trim()) {
        toast.error("Пожалуйста, введите имя пользователя");
        return;
      }
      if (username.length < 3) {
        toast.error("Имя пользователя должно содержать не менее 3 символов");
        return;
      }
      // For demo purposes, make email validation less strict
      if (!email.trim()) {
        // Allow empty email for demo
        // toast.error("Пожалуйста, введите email");
        // return;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Пожалуйста, введите корректный email");
        return;
      }
      if (!password.trim()) {
        toast.error("Пожалуйста, введите пароль");
        return;
      }

      // Enhanced password validation
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        toast.error(passwordErrors[0]); // Show first error
        return;
      }

      if (!confirmPassword.trim()) {
        toast.error("Пожалуйста, подтвердите пароль");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Пароли не совпадают");
        return;
      }
      // For demo purposes, make name fields optional
      // if (!firstName.trim()) {
      //   toast.error("Пожалуйста, введите ваше имя");
      //   return;
      // }
      // if (!lastName.trim()) {
      //   toast.error("Пожалуйста, введите вашу фамилию");
      //   return;
      // }

      // Register the user (invitation code handling is now in the register endpoint)
      const registerData: any = {
        username,
        password,
        firstName,
        lastName,
      };

      // Only include familyName if it's provided and not using invitation code
      if (familyName.trim() && !invitationCode) {
        registerData.familyName = familyName;
      }

      // Include invitation code if provided
      if (invitationCode) {
        registerData.invitationCode = invitationCode;
      }

      const data = await fetchApi("/api/register", {
        method: "POST",
        body: JSON.stringify(registerData),
      });

      await login({
        id: data.user.id,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        familyId: data.user.familyId,
        role: data.user.role,
      });

      // Redirect to family page if user has no family, otherwise to dashboard
      if (!data.user.familyId) {
        setLocation("/family");
        toast.success("Регистрация успешна! Теперь создайте семью или используйте код приглашения.");
      } else {
        setLocation("/");
        toast.success("Регистрация успешна! Добро пожаловать!");
      }
    } catch (error) {
      toast.error("Ошибка регистрации: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-lg mx-auto">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold font-heading">FamilyFinance</CardTitle>
          <CardDescription className="text-sm">
            Управляйте семейным бюджетом вместе
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-10 sm:h-11" role="tablist" aria-label="Выбор формы аутентификации">
              <TabsTrigger value="login" role="tab" aria-controls="login-panel" className="text-sm touch-target">Вход</TabsTrigger>
              <TabsTrigger value="register" role="tab" aria-controls="register-panel" className="text-sm touch-target">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Имя пользователя</Label>
                  <Input
                    id="login-username"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal">
                    Запомнить меня
                  </Label>
                </div>
                <Button type="submit" className="w-full touch-target touch-feedback" size="lg">
                  Войти
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline cursor-pointer"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Забыли пароль?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Имя пользователя</Label>
                  <Input
                    id="register-username"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {activeTab === "register" && password && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs text-muted-foreground">Сложность пароля:</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-8 rounded-full transition-colors ${
                              passwordStrength >= level
                                ? level <= 2 ? 'bg-red-500'
                                : level <= 4 ? 'bg-yellow-500'
                                : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getPasswordStrengthLabel(passwordStrength)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Подтвердите пароль</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {activeTab === "register" && confirmPassword && password !== confirmPassword && (
                    <div className="text-xs text-red-500 mt-1">
                      Пароли не совпадают
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstName">Имя</Label>
                    <Input
                      id="register-firstName"
                      placeholder="Иван"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastName">Фамилия</Label>
                    <Input
                      id="register-lastName"
                      placeholder="Иванов"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-familyName">Название семьи (опционально)</Label>
                  <Input
                    id="register-familyName"
                    placeholder="Семья Ивановых"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-invitationCode">Код приглашения (опционально)</Label>
                  <Input
                    id="register-invitationCode"
                    placeholder="Введите код приглашения"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full touch-target touch-feedback" size="lg">
                  Зарегистрироваться
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          {activeTab === "login" ? (
            <span>
              Нет аккаунта? &nbsp;
              <span
                className="text-primary hover:underline cursor-pointer"
                onClick={() => setActiveTab("register")}
              >
                Регистрация
              </span>
            </span>
          ) : (
            <span>
              Уже есть аккаунт? &nbsp;
              <span
                className="text-primary hover:underline cursor-pointer"
                onClick={() => setActiveTab("login")}
              >
                Вход
              </span>
            </span>
          )}
        </CardFooter>
        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Восстановление пароля</CardTitle>
                <CardDescription>Введите ваш email для восстановления доступа</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Отправка..." : "Отправить ссылку для сброса"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
