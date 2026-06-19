import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";

export default function AdminTelegram() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: config, isLoading } = trpc.adminTelegram.getConfig.useQuery();
  const updateConfig = trpc.adminTelegram.updateConfig.useMutation();
  const testNotification = trpc.adminTelegram.testNotification.useMutation();

  useEffect(() => {
    if (config) {
      setBotToken(config.botToken || "");
      setChatId(config.chatId || "");
    }
  }, [config]);

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setErrorMsg("Заполните все поля");
      return;
    }
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      await updateConfig.mutateAsync({ botToken: botToken.trim(), chatId: chatId.trim() });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e: any) {
      setSaveStatus("error");
      setErrorMsg(e?.message || "Ошибка сохранения");
    }
  };

  const handleTest = async () => {
    setTestStatus("sending");
    setErrorMsg("");
    try {
      await testNotification.mutateAsync();
      setTestStatus("success");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch (e: any) {
      setTestStatus("error");
      setErrorMsg(e?.message || "Ошибка отправки тестового сообщения");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Telegram уведомления</h1>
      <p className="text-gray-400 mb-6">
        Настройте Telegram бота для получения уведомлений о новых заявках на обмен.
      </p>

      {isLoading ? (
        <div className="text-gray-400">Загрузка...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${config ? "bg-green-500" : "bg-gray-500"}`} />
            <span className="text-sm text-gray-400">
              {config ? "Telegram настроен" : "Telegram не настроен"}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bot Token
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="8816103988:AAEqnu-_3ZGLlo0Xv63sUvtaVhCeMlgvCUs"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-5358706921"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID группы или канала. Используйте @userinfobot для получения ID.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {saveStatus === "saving" ? "Сохранение..." :
               saveStatus === "success" ? "✅ Сохранено!" :
               saveStatus === "error" ? "❌ Ошибка" :
               "Сохранить"}
            </button>
            <button
              onClick={handleTest}
              disabled={testStatus === "sending" || !config}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {testStatus === "sending" ? "Отправка..." :
               testStatus === "success" ? "✅ Отправлено!" :
               testStatus === "error" ? "❌ Ошибка" :
               "Тест уведомления"}
            </button>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">📋 Что содержит уведомление:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>🔔 Номер заявки</li>
              <li>👤 Telegram пользователя для связи</li>
              <li>🔄 Направление обмена (монета → монета)</li>
              <li>💰 Сумма обмена</li>
              <li>📍 Реквизиты для выплаты (адрес/карта/СБП)</li>
              <li>📥 Адрес депозита</li>
            </ul>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
