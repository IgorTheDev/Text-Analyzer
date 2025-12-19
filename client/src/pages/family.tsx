import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useData } from "@/lib/dataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Home, Save, UserPlus } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currentFamily, familyMembers } from "@/lib/mockData";

export default function FamilyPage() {
  const { currentUser, login, logout } = useData();
  const [, setLocation] = useLocation(); // Move hook call to top
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, "admin" | "member">>({});
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (currentUser?.familyId) {
      fetchFamilyData();
    } else {
      setLoading(false);
    }
  }, [currentUser?.familyId]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);

      // Get family members
      const data = await fetchApi(`/families/${currentUser?.familyId}/members`);
      setFamily(data.family);

      // Show all family members including the current user
      // In a real app, this would come from the API
      if (data.members && data.members.length > 0) {
        setMembers(data.members);
      } else {
        // Fallback: show current user if no members returned
        if (currentUser) {
          setMembers([
            {
              id: currentUser.id,
              username: currentUser.username,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              role: currentUser.role,
            }
          ]);
        }
      }

    } catch (error) {
      toast.error("Ошибка загрузки данных семьи: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoleChanges = async () => {
    try {
      // Save each pending role change
      for (const [memberId, newRole] of Object.entries(pendingRoleChanges)) {
        await fetchApi(`/families/${currentUser?.familyId}/members/${memberId}`, {
          method: "PUT",
          body: JSON.stringify({ role: newRole }),
        });
      }

      // Apply changes to local state
      setMembers(members.map(member => ({
        ...member,
        role: pendingRoleChanges[member.id] || member.role
      })));

      // Clear pending changes
      setPendingRoleChanges({});

      toast.success("Изменения ролей сохранены");
    } catch (error) {
      toast.error("Ошибка сохранения изменений ролей: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const hasPendingChanges = Object.keys(pendingRoleChanges).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user doesn't have family access, redirect to dashboard
  if (!currentUser?.familyId) {
    setLocation("/");
    return null;
  }


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Главная
          </Button>
          <h1 className="text-3xl font-bold">Семейный аккаунт</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Члены семьи</CardTitle>
              <CardDescription>Все члены вашей семьи имеют доступ к общему бюджету</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Роль</TableHead>
                    {currentUser?.role === "admin" && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const currentRole = pendingRoleChanges[member.id] || member.role;
                    const hasPendingChange = pendingRoleChanges[member.id] !== undefined;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">
                            {member.firstName || member.username}
                            {hasPendingChange && (
                              <span className="ml-2 text-xs text-orange-600 font-normal">
                                (изменено)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            currentRole === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {currentRole === "admin" ? "Администратор" : "Участник"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {currentUser?.role === "admin" && member.id !== currentUser.id && (
                            <div className="flex justify-end gap-2">
                              <Select
                                value={currentRole}
                                onValueChange={(newRole) => {
                                  // Store pending change instead of applying immediately
                                  setPendingRoleChanges(prev => ({
                                    ...prev,
                                    [member.id]: newRole as "admin" | "member"
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue placeholder="Роль" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Администратор</SelectItem>
                                  <SelectItem value="member">Участник</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingMember(member);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить члена семьи?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите удалить {member.firstName || member.username} из семьи?
                                      Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={async () => {
                                        try {
                                          // Call API to remove member from family
                                          await fetchApi("/families/leave", {
                                            method: "POST",
                                            body: JSON.stringify({
                                              userId: member.id,
                                            }),
                                          });

                                          // Update local state
                                          setMembers(members.filter(m => m.id !== member.id));
                                          toast.success("Член семьи удален успешно");
                                        } catch (error) {
                                          toast.error("Ошибка удаления члена семьи: " + (error instanceof Error ? error.message : "Unknown error"));
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {hasPendingChanges && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={handleSaveRoleChanges}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Сохранить изменения ролей
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Присоединиться к семье</CardTitle>
                <CardDescription>Введите код приглашения для присоединения к существующей семье</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Введите код приглашения"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    if (!joinCode.trim()) {
                      toast.error("Пожалуйста, введите код приглашения");
                      return;
                    }

                    try {
                      // For existing family members, we need to register with the invitation code
                      // This will add them to the family during registration
                      toast.info("Используйте этот код при регистрации нового аккаунта");
                    } catch (error) {
                      toast.error("Ошибка обработки кода: " + (error instanceof Error ? error.message : "Unknown error"));
                    }
                  }}
                  disabled={!joinCode.trim()}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Использовать код
                </Button>

                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  <p>Чтобы присоединиться к семье:</p>
                  <p className="mt-2">1. Получите код приглашения от администратора семьи</p>
                  <p className="mt-1">2. Введите код выше</p>
                  <p className="mt-1">3. Создайте новый аккаунт с этим кодом</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Сгенерировать код приглашения</CardTitle>
                <CardDescription>Создайте код, который можно поделиться с семьей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetchApi(`/families/${currentUser?.familyId}/generate-invitation`, {
                        method: "POST",
                        body: JSON.stringify({
                          invitedBy: currentUser?.id,
                        }),
                      });

                      setGeneratedCode(response.invitationCode);
                      toast.success(`Сгенерирован код приглашения: ${response.invitationCode}`);
                    } catch (error) {
                      toast.error("Ошибка генерации кода: " + (error instanceof Error ? error.message : "Unknown error"));
                    }
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Сгенерировать код
                </Button>

                {generatedCode && (
                  <div className="p-4 bg-secondary rounded-lg border">
                    <div className="text-sm font-medium mb-2">Сгенерированный код приглашения</div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedCode}
                        readOnly
                        className="font-mono text-lg text-center flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          toast.success("Код скопирован в буфер обмена");
                        }}
                      >
                        Копировать
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Поделитесь этим кодом с членом семьи, чтобы он мог присоединиться к вашему семейному аккаунту.
                    </p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  <p>Используйте код приглашения для добавления членов семьи:</p>
                  <p className="mt-2">1. Сгенерируйте код выше</p>
                  <p>2. Поделитесь кодом с членом семьи</p>
                  <p>3. Член семьи вводит код при регистрации</p>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
