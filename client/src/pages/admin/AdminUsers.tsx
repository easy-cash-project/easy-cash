import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Edit2, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Admin - Полный доступ" },
  { value: "manager", label: "Manager - Управление заявками и курсами" },
  { value: "operator", label: "Operator - Просмотр и управление адресами" },
  { value: "viewer", label: "Viewer - Только просмотр" },
];

const STATUSES = [
  { value: "active", label: "Активен" },
  { value: "inactive", label: "Неактивен" },
];

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.adminUsers.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    openId: "",
    name: "",
    email: "",
    password: "",
    role: "viewer",
    status: "active",
  });

  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      toast.success("Пользователь добавлен");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      toast.success("Пользователь обновлён");
      refetch();
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("Пользователь удалён");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowAdd(false);
    setFormData({
      openId: "",
      name: "",
      email: "",
      password: "",
      role: "viewer",
      status: "active",
    });
  };

  const handleCreate = () => {
    if (!formData.openId || !formData.password) {
      toast.error("Заполните обязательные поля (OpenID, пароль)");
      return;
    }
    createMutation.mutate({
      openId: formData.openId,
      name: formData.name || null,
      email: formData.email || null,
      password: formData.password,
      role: formData.role as "admin" | "manager" | "operator" | "viewer",
      status: formData.status as "active" | "inactive",
    });
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      openId: user.openId,
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role,
      status: user.status,
    });
  };

  const handleSave = () => {
    if (editingId === null) return;
    updateMutation.mutate({
      id: editingId,
      name: formData.name || null,
      email: formData.email || null,
      role: formData.role as "admin" | "manager" | "operator" | "viewer",
      status: formData.status as "active" | "inactive",
      password: formData.password || undefined,
    });
  };

  const getRoleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role;
  const getStatusLabel = (status: string) => STATUSES.find(s => s.value === status)?.label || status;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
            <p className="text-sm text-muted-foreground">Создание пользователей и управление правами доступа</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button size="sm" onClick={() => { setEditingId(null); setShowAdd(!showAdd); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Добавить пользователя
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAdd || editingId !== null) && (
          <Card className="p-6 bg-card border-border/50 space-y-4">
            <h3 className="font-semibold text-lg">
              {editingId !== null ? "Редактировать пользователя" : "Новый пользователь"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">OpenID *</label>
                <Input
                  value={formData.openId}
                  onChange={(e) => setFormData({ ...formData, openId: e.target.value })}
                  placeholder="username или email"
                  disabled={editingId !== null}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Имя</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Полное имя"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Пароль {editingId === null ? "*" : "(оставьте пусто для сохранения текущего)"}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Роль</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  {STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingId !== null ? handleSave : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingId !== null ? "Сохранить" : "Создать"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Отмена
              </Button>
            </div>
          </Card>
        )}

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !users?.length ? (
          <Card className="p-8 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Пользователи не добавлены</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">OpenID</th>
                  <th className="text-left py-3 px-4">Имя</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Роль</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Создан</th>
                  <th className="text-right py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{user.openId}</td>
                    <td className="py-3 px-4">{user.name || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{user.email || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.status === "active"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate({ id: user.id })}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Roles Description */}
        <Card className="p-6 bg-secondary/30 border-border/50">
          <h3 className="font-semibold mb-4">Описание ролей</h3>
          <div className="space-y-3">
            {ROLES.map(role => (
              <div key={role.value} className="space-y-1">
                <p className="font-medium text-sm">{role.label}</p>
                <p className="text-xs text-muted-foreground">
                  {role.value === "admin" && "Полный доступ ко всем разделам админ панели"}
                  {role.value === "manager" && "Может управлять заявками, курсами и просматривать адреса"}
                  {role.value === "operator" && "Может просматривать заявки и управлять адресами кошельков"}
                  {role.value === "viewer" && "Может только просматривать все данные без возможности редактирования"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
