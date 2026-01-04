import React, { useState } from 'react';
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



const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [theme, toggleTheme] = useTheme();
    const { showToast } = useToast();

    // Local state for profile form
    const [name, setName] = useState(user?.email?.split('@')[0] || 'Pengguna');
    const [email] = useState(user?.email || '');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(user?.user_metadata?.avatar_url || null);

    const [uploading, setUploading] = useState(false);

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

        } catch (error: any) {
            console.error('Error uploading image:', error);
            showToast({
                type: 'error',
                title: 'Gagal Mengunggah',
                message: error.message || 'Terjadi kesalahan saat mengunggah foto.'
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profil Saya</h3>
                        <p className="text-sm text-gray-500">Informasi pribadi dan foto profil</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`} />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${uploading ? 'animate-pulse' : ''}`}>
                                        <UserCircleIcon className="w-20 h-20" />
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-primary-dark transition-colors">
                                <PencilIcon className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">Klik ikon pensil untuk mengubah</p>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah (Login akun)</p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleSaveProfile}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 active:scale-95"
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
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preferensi Aplikasi</h3>
                            <p className="text-sm text-gray-500">Tampilan dan bahasa</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Mode Gelap</p>
                                <p className="text-xs text-gray-500">Gunakan tema gelap untuk kenyamanan mata</p>
                            </div>
                            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
                        </div>
                        <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Bahasa</p>
                                <p className="text-xs text-gray-500">Bahasa Indonesia (Default)</p>
                            </div>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">ID</span>
                        </div>
                        <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Mata Uang</p>
                                <p className="text-xs text-gray-500">Rupiah Indonesia (IDR)</p>
                            </div>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">IDR</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <BellIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifikasi</h3>
                            <p className="text-sm text-gray-500">Atur cara kami menghubungi Anda</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Notifikasi Push</p>
                                <p className="text-xs text-gray-500">Terima notifikasi di perangkat ini</p>
                            </div>
                            <Toggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email Newsletter</p>
                                <p className="text-xs text-gray-500">Update fitur dan tips keuangan</p>
                            </div>
                            <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
