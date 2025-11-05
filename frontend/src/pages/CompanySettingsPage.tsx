import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companySettingsApi, uploadApi, telegramApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Loader2, Save, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/authStore';

export const CompanySettingsPage = () => {
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuthStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: companySettingsApi.get,
  });

  const { data: telegramLink } = useQuery({
    queryKey: ['telegram-link'],
    queryFn: telegramApi.getLink,
    enabled: !user?.telegramId,
  });

  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    inn: '',
    director: '',
    bank: '',
    bik: '',
    accountNumber: '',
    logoUrl: '',
  });

  // Обновляем formData когда приходят данные
  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        website: settings.website,
        inn: settings.inn,
        director: settings.director,
        bank: settings.bank,
        bik: settings.bik,
        accountNumber: settings.accountNumber,
        logoUrl: settings.logoUrl || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: companySettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      alert('Настройки успешно сохранены');
    },
    onError: (error) => {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить настройки');
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const result = await uploadApi.uploadSchemaImage(file);
      setFormData((prev) => ({ ...prev, logoUrl: result.url }));
    } catch (error) {
      console.error('Ошибка загрузки логотипа:', error);
      alert('Не удалось загрузить логотип');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Настройки компании
        </h1>
        <p className="text-gray-600 mt-2">
          Укажите информацию о вашем предприятии для использования в документах и путевых листах
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Логотип */}
        <Card>
          <CardHeader>
            <CardTitle>Логотип компании</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {formData.logoUrl ? (
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                  <img
                    src={formData.logoUrl}
                    alt="Логотип"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Выбрать файл</span>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        disabled:opacity-50"
                    />
                  </div>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG или GIF. Максимум 2MB.
                </p>
                {uploadingLogo && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Загрузка...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Telegram-бот
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.telegramId ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Telegram привязан</p>
                  <p className="text-sm text-green-700">Вы будете получать уведомления</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Привяжите свой Telegram аккаунт для получения уведомлений о заказах и задачах
                </p>
                <Button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {showQR ? 'Скрыть QR код' : 'Показать QR код'}
                </Button>
                {showQR && telegramLink?.link && (
                  <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <QRCodeSVG value={telegramLink.link} size={200} level="H" />
                    <p className="text-sm text-gray-600 text-center max-w-md">
                      Отсканируйте QR код камерой телефона, чтобы открыть бота{' '}
                      <span className="font-mono font-semibold">@{telegramLink.botUsername}</span>
                    </p>
                    <a
                      href={telegramLink.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Или откройте ссылку вручную
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Название компании *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.ru"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Город, улица, дом"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Веб-сайт</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.ru"
              />
            </div>
          </CardContent>
        </Card>

        {/* Юридическая информация */}
        <Card>
          <CardHeader>
            <CardTitle>Юридическая информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ИНН</label>
                <Input
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Директор</label>
                <Input
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Банковские реквизиты */}
        <Card>
          <CardHeader>
            <CardTitle>Банковские реквизиты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название банка</label>
              <Input
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="ПАО Сбербанк"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">БИК</label>
                <Input
                  value={formData.bik}
                  onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                  placeholder="044525225"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Расчётный счёт</label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="40702810..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопка сохранения */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
