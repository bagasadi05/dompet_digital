import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../contexts/ToastContext';
import {
    UserCircleIcon,
    SettingsIcon,
    BellIcon,
    PencilIcon
} from './common/Icons';
import Toggle from './common/Toggle';
import {
    requestNotificationPermission,
    getNotificationPermission
} from '../services/pushNotificationService';
import { NotificationService } from '../services/notificationService';
import {
    getNotificationPreferences,
    saveNotificationPreferences,
    NotificationPreferences
} from '../services/notificationSchedulerService';


import {
    getTelegramConfig,
    saveTelegramConfig,
    sendTestMessage,
    TelegramConfig
} from '../services/telegramService';
import { Bill } from '../services/types';



const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [theme, toggleTheme] = useTheme();
    const { showToast } = useToast();

    // Local state for profile form
    const [name, setName] = useState(user?.email?.split('@')[0] || 'Pengguna');
    const [email] = useState(user?.email || '');

    // Notification state
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(getNotificationPreferences());

    // Telegram state
    const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(getTelegramConfig());
    const [isTestingTelegram, setIsTestingTelegram] = useState(false);


    const [profileImage, setProfileImage] = useState<string | null>(user?.user_metadata?.avatar_url || null);

    const [uploading, setUploading] = useState(false);

    // Initialize notification permission status
    useEffect(() => {
        setNotificationPermission(getNotificationPermission());
    }, []);

    // Handle push notification toggle
    const handlePushToggle = async (enabled: boolean) => {
        if (enabled && notificationPermission !== 'granted') {
            const permission = await requestNotificationPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                showToast({
                    type: 'success',
                    title: 'Notifikasi Diaktifkan',
                    message: 'Anda akan menerima notifikasi penting.'
                });
                updatePrefs({ pushEnabled: true });
            } else if (permission === 'denied') {
                showToast({
                    type: 'error',
                    title: 'Izin Ditolak',
                    message: 'Silakan aktifkan notifikasi di pengaturan browser.'
                });
            }
        } else {
            updatePrefs({ pushEnabled: enabled });
        }
    };

    // Update preferences helper
    const updatePrefs = (updates: Partial<NotificationPreferences>) => {
        const newPrefs = { ...notificationPrefs, ...updates };
        setNotificationPrefs(newPrefs);
        saveNotificationPreferences(updates);
    };

    // Update Telegram config helper
    const updateTelegramConfig = (updates: Partial<TelegramConfig>) => {
        const newConfig = { ...telegramConfig, ...updates };
        setTelegramConfig(newConfig);
        saveTelegramConfig(newConfig);
    };



    const handleTestLocalNotification = async () => {
        try {
            const billStub = {
                id: 'test-notification',
                name: 'Uji Coba Notifikasi',
                amount: 50000,
                nextDueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                frequency: 'monthly' as const
            } as Bill;

            await NotificationService.scheduleBillNotification(billStub);

            showToast({
                type: 'success',
                title: 'Notifikasi Dijadwalkan',
                message: 'Cek panel notifikasi Anda (mungkin perlu menunggu 1 menit atau cek log).'
            });

            // Also force an immediate one for demo if possible?
            // LocalNotifications plugin doesn't have "fire now" easily without scheduling for "now + 1 sec"
        } catch (error) {
            console.error(error);
            showToast({
                type: 'error',
                title: 'Gagal',
                message: 'Gagal menjadwalkan notifikasi.'
            });
        }
    };

    const handleTestTelegram = async () => {
        if (!telegramConfig.botToken || !telegramConfig.chatId) {
            showToast({
                type: 'error',
                title: 'Konfigurasi Tidak Lengkap',
                message: 'Mohon isi Bot Token dan Chat ID terlebih dahulu.'
            });
            return;
        }

        setIsTestingTelegram(true);
        const result = await sendTestMessage(telegramConfig.botToken, telegramConfig.chatId);
        setIsTestingTelegram(false);

        if (result.success) {
            showToast({
                type: 'success',
                title: 'Berhasil',
                message: 'Pesan tes terkirim! Cek Telegram Anda.'
            });

            // Sync to Supabase user_profiles for Edge Function authentication
            if (user) {
                try {
                    const { error } = await supabase
                        .from('user_profiles')
                        .upsert({
                            user_id: user.id,
                            telegram_chat_id: telegramConfig.chatId.trim(),
                            last_updated: new Date().toISOString()
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error('Error syncing Telegram ID to profile:', error);
                    } else {
                        console.log('Telegram ID synced to profile');
                    }
                } catch (err) {
                    console.error('Error syncing Telegram ID:', err);
                }
            }

        } else {
            showToast({
                type: 'error',
                title: 'Gagal',
                message: result.message
            });
        }
    };
    const handleSaveProfile = () => {
        // Simulate API call for name update (or implement real one later)
        setTimeout(() => {
            showToast({
                type: 'success',
                title: 'Profil Diperbarui',
                message: 'Perubahan profil Anda telah berhasil disimpan.'
            });
        }, 500);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                showToast({
                    type: 'error',
                    title: 'Ukuran File Terlalu Besar',
                    message: 'Maksimal ukuran file adalah 2MB.'
                });
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update User Metadata
            const { error: updateUserError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateUserError) {
                throw updateUserError;
            }

            setProfileImage(publicUrl);
            showToast({
                type: 'success',
                title: 'Foto Profil Diubah',
                message: 'Foto profil baru berhasil diunggah dan disimpan.'
            });

        } catch (error: unknown) {
            console.error('Error uploading image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto.';
            showToast({
                type: 'error',
                title: 'Gagal Mengunggah',
                message: errorMessage
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20 md:pb-0">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h2>
                <p className="text-gray-500 dark:text-gray-400">Kelola profil dan preferensi aplikasi Anda</p>
            </div>

            {/* Profile Section */}
            <div className="glass-panel p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white ring-4 ring-white/20">
                        <UserCircleIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profil Saya</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kelola informasi pribadi Anda</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                        <div className="relative group/avatar cursor-pointer">
                            <div className="w-36 h-36 rounded-full overflow-hidden bg-white/50 dark:bg-gray-800/50 border-4 border-white dark:border-gray-700/50 shadow-xl ring-1 ring-gray-100 dark:ring-white/10 transition-transform duration-300 group-hover/avatar:scale-105">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className={`w-full h-full object-cover ${uploading ? 'opacity-50 grayscale' : ''}`} />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 ${uploading ? 'animate-pulse' : ''}`}>
                                        <UserCircleIcon className="w-24 h-24" />
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-1 right-1 bg-gradient-to-r from-primary to-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-primary/30 cursor-pointer hover:scale-110 active:scale-95 transition-all border-2 border-white dark:border-gray-800">
                                <PencilIcon className="w-5 h-5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Foto Profil</p>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1 w-full space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full h-14 px-5 rounded-2xl bg-gray-100/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/5 text-gray-500 font-medium cursor-not-allowed backdrop-blur-sm"
                            />
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Email digunakan untuk login dan tidak dapat diubah
                            </p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleSaveProfile}
                                className="px-8 py-3 bg-gradient-to-r from-primary to-emerald-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Settings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferences */}
                <div className="glass-panel p-6 rounded-[2rem] h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20 flex items-center justify-center text-white ring-2 ring-white/10">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preferensi</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tampilan & Sistem</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Mode Gelap</p>
                                <p className="text-xs text-gray-500">Tampilan nyaman di mata</p>
                            </div>
                            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
                        </div>
                        <div className="flex items-center justify-between opacity-60 pointer-events-none p-3">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Bahasa</p>
                                <p className="text-xs text-gray-500">Bahasa Indonesia</p>
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">ID</span>
                        </div>
                        <div className="flex items-center justify-between opacity-60 pointer-events-none p-3">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Mata Uang</p>
                                <p className="text-xs text-gray-500">Rupiah Indonesia</p>
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">IDR</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="glass-panel p-6 rounded-[2rem] h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 flex items-center justify-center text-white ring-2 ring-white/10">
                            <BellIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifikasi</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pusat Pemberitahuan</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Push Notifications */}
                        <div className="flex items-center justify-between p-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Notifikasi Push</p>
                                <p className="text-xs text-gray-500">
                                    {notificationPermission === 'granted'
                                        ? 'Aktif'
                                        : notificationPermission === 'denied'
                                            ? 'Diblokir'
                                            : 'Nonaktif'}
                                </p>
                            </div>
                            <Toggle
                                checked={notificationPrefs.pushEnabled && notificationPermission === 'granted'}
                                onChange={handlePushToggle}
                                disabled={notificationPermission === 'denied'}
                            />
                        </div>

                        {/* Test Button */}
                        <div className="flex justify-end border-b border-gray-100 dark:border-white/5 pb-4">
                            <button
                                onClick={handleTestLocalNotification}
                                className="text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                                👋 Test Notifikasi
                            </button>
                        </div>

                        {/* Daily Reminder */}
                        <div className="flex items-center justify-between p-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Pengingat Harian</p>
                                <p className="text-xs text-gray-500">Ingat catat transaksi</p>
                            </div>
                            <Toggle
                                checked={notificationPrefs.dailyReminderEnabled}
                                onChange={(checked) => updatePrefs({ dailyReminderEnabled: checked })}
                            />
                        </div>

                        {/* Daily Reminder Time */}
                        {notificationPrefs.dailyReminderEnabled && (
                            <div className="flex items-center justify-between pl-4 border-l-2 border-primary/30 ml-2">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Waktu</p>
                                <input
                                    type="time"
                                    value={notificationPrefs.dailyReminderTime}
                                    onChange={(e) => updatePrefs({ dailyReminderTime: e.target.value })}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 text-sm font-bold backdrop-blur-sm"
                                />
                            </div>
                        )}

                        {/* Weekly Report */}
                        <div className="flex items-center justify-between p-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Laporan Mingguan</p>
                                <p className="text-xs text-gray-500">Ringkasan mingguan</p>
                            </div>
                            <Toggle
                                checked={notificationPrefs.weeklyReportEnabled}
                                onChange={(checked) => updatePrefs({ weeklyReportEnabled: checked })}
                            />
                        </div>

                        {/* Sound & Vibration */}
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preferensi Alert</p>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Suara</p>
                                    <Toggle
                                        checked={notificationPrefs.soundEnabled ?? true}
                                        onChange={(checked) => updatePrefs({ soundEnabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Getaran</p>
                                    <Toggle
                                        checked={notificationPrefs.vibrationEnabled ?? true}
                                        onChange={(checked) => updatePrefs({ vibrationEnabled: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Telegram Integration */}
                <div className="glass-panel p-6 rounded-[2rem] h-full flex flex-col mt-6 sm:mt-0">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20 flex items-center justify-center text-white ring-2 ring-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.05-2.4-1.66-1.06-.7-.37-1.09.23-1.72.15-.16 2.78-2.55 2.83-2.77.01-.03.01-.14-.06-.2-.06-.06-.17-.03-.24-.01-.11.02-1.87 1.18-5.28 3.46-.49.34-.93.51-1.33.5-.44-.01-1.28-.25-1.91-.44-.77-.24-1.38-.37-1.33-.78.03-.22.32-.44.88-.66 3.42-1.49 5.7-2.43 6.84-2.9 3.25-1.35 3.93-1.6 4.38-1.61.1 0 .32.02.47.14.12.1.16.24.18.39-.01.07.01.21-.01.29z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Integrasi Telegram</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Bot Notifikasi Cerdas</p>
                        </div>
                    </div>

                    <div className="space-y-5 flex-1">
                        <div className="flex items-center justify-between p-2">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Aktifkan Bot</p>
                                <p className="text-xs text-gray-500">Terima notifikasi di Telegram</p>
                            </div>
                            <Toggle
                                checked={telegramConfig.enabled}
                                onChange={(checked) => updateTelegramConfig({ enabled: checked })}
                            />
                        </div>

                        {telegramConfig.enabled && (
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-slideDown">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Bot Token
                                    </label>
                                    <input
                                        type="password"
                                        value={telegramConfig.botToken}
                                        onChange={(e) => updateTelegramConfig({ botToken: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 text-sm font-mono tracking-wide transition-all backdrop-blur-sm"
                                        placeholder="123456789:ABCdefGhIVk..."
                                    />
                                    <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold flex items-center gap-1">
                                        ↗ Dapatkan dari @BotFather
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Chat ID
                                    </label>
                                    <input
                                        type="text"
                                        value={telegramConfig.chatId}
                                        onChange={(e) => updateTelegramConfig({ chatId: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 text-sm font-mono tracking-wide transition-all backdrop-blur-sm"
                                        placeholder="123456789"
                                    />
                                    <p className="text-[10px] text-gray-500">ID unik user Telegram Anda (gunakan @userinfobot)</p>
                                </div>

                                <button
                                    onClick={handleTestTelegram}
                                    disabled={!telegramConfig.botToken || !telegramConfig.chatId || isTestingTelegram}
                                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${!telegramConfig.botToken || !telegramConfig.chatId
                                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-sky-400 to-blue-600 text-white hover:from-sky-500 hover:to-blue-700 hover:shadow-lg shadow-sky-500/30 active:scale-95'
                                        }`}
                                >
                                    {isTestingTelegram ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                                            </svg>
                                            Kirim Pesan Tes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default SettingsPage;
