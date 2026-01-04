import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Icons
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const EyeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

const WalletLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
    </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ShoppingBagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.375 15.389 4.621-4.621a2.25 2.25 0 0 1 3.182 0l4.621 4.621m-4.621-4.621a2.25 2.25 0 0 0-3.182 0l-4.621 4.621m7.803-4.621 3.182 3.182a2.25 2.25 0 0 0 3.182 0l2.909-2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithPassword, signUpNewUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLoginView) {
                const { error } = await signInWithPassword(email, password);
                if (error) throw error;
            } else {
                const { error } = await signUpNewUser(email, password);
                if (error) throw error;
                alert('Pendaftaran berhasil! Silakan periksa email Anda untuk mengklik link verifikasi.');
                setIsLoginView(true);
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Left Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12 xl:p-20 justify-center relative overflow-y-auto">
                {/* Logo Header */}
                <div className="absolute top-6 left-6 lg:top-12 lg:left-12 flex items-center gap-3">
                    <WalletLogo className="w-8 h-8 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Dompet Digital</span>
                </div>

                {/* Main Content Area */}
                <div className="mx-auto w-full max-w-md mt-16 lg:mt-0">
                    <div className="mb-10 text-left">
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                            {isLoginView ? 'Selamat Datang' : 'Buat Akun Baru'}
                        </h1>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                            {isLoginView
                                ? 'Kelola keuangan Anda dengan aman dan efisien.'
                                : 'Daftar untuk mulai mengatur keuangan Anda.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                                Alamat Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@contoh.com"
                                className="w-full h-12 lg:h-14 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                                Kata Sandi
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="w-full h-12 lg:h-14 px-4 pr-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-gray-500 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot - Only on Login */}
                        {isLoginView && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Ingat saya</span>
                                </label>
                                <a className="text-sm font-semibold text-gray-900 hover:text-primary dark:text-white dark:hover:text-primary transition-colors" href="#">
                                    Lupa kata sandi?
                                </a>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 lg:h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                isLoginView ? 'Masuk' : 'Daftar'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                                Atau lanjutkan dengan
                            </span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" />
                                <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00" />
                                <path d="M12 22C14.666 22 17.054 21.0265 18.8405 19.3625L15.528 16.399C14.5665 17.0205 13.363 17.399 12 17.399C9.3885 17.399 7.173 15.7275 6.3485 13.399L3.0885 15.8955C4.773 19.1415 8.129 22 12 22Z" fill="#4CAF50" />
                                <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.257 15.108 16.5465 16.076 15.528 16.399L18.8405 19.3625C20.727 17.625 21.8055 14.992 21.8055 10.0415Z" fill="#1976D2" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.1 1.88-2.35 5.79.6 7.15-.67 1.91-1.42 3.38-2.65 4.06zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Apple</span>
                        </button>
                    </div>

                    {/* Footer Sign Up / Sign In */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isLoginView ? "Belum punya akun? " : "Sudah punya akun? "}
                            <button
                                onClick={() => {
                                    setIsLoginView(!isLoginView);
                                    setError(null);
                                }}
                                className="font-bold text-gray-900 dark:text-primary hover:underline"
                            >
                                {isLoginView ? 'Daftar' : 'Masuk'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Visual/Hero */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950"></div>
                <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"></div>

                <div className="relative z-10 w-full max-w-lg p-8 flex flex-col items-center text-center">
                    {/* Abstract Mobile Device Mockup */}
                    <div
                        className="relative w-72 h-[480px] bg-gray-800 rounded-[40px] border-8 border-gray-700 shadow-2xl rotate-[-6deg] mb-12 hover:rotate-0 transition-transform duration-500 overflow-hidden"
                        style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)' }}
                    >
                        {/* Inner Screen Content */}
                        <div className="p-6 flex flex-col h-full">
                            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6 opacity-30"></div>
                            <div className="text-left mb-6">
                                <p className="text-gray-400 text-xs font-medium">Saldo Total</p>
                                <h3 className="text-white text-3xl font-bold mt-1">Rp 24.500.000</h3>
                            </div>

                            {/* Credit Card Visual */}
                            <div className="w-full aspect-[1.58] bg-gradient-to-br from-primary to-emerald-600 rounded-2xl p-4 shadow-lg mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
                                <div className="flex justify-between items-start">
                                    <div className="w-8 h-5 rounded bg-white/20"></div>
                                    <span className="text-gray-900 font-bold italic opacity-60">VISA</span>
                                </div>
                                <div className="mt-8 flex gap-3 items-center">
                                    <span className="text-gray-900 font-mono tracking-widest text-sm">•••• 4242</span>
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                            <ShoppingBagIcon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-xs font-bold">Belanja Mingguan</p>
                                            <p className="text-gray-400 text-[10px]">Hari ini, 10:23</p>
                                        </div>
                                    </div>
                                    <span className="text-white text-xs font-bold">-Rp 120.500</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <FilmIcon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-xs font-bold">Tiket Bioskop</p>
                                            <p className="text-gray-400 text-[10px]">Kemarin, 20:15</p>
                                        </div>
                                    </div>
                                    <span className="text-white text-xs font-bold">-Rp 75.000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial/Trust */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                            <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                            <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">J</div>
                            <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-primary flex items-center justify-center text-xs font-bold text-gray-900">
                                +1K
                            </div>
                        </div>
                        <p className="text-gray-300 text-lg font-medium max-w-sm mx-auto">
                            "Cara paling aman untuk mengelola keuangan digital Anda. Dipercaya oleh ribuan pengguna."
                        </p>
                        <div className="flex gap-1 justify-center text-primary">
                            <StarIcon className="w-5 h-5" />
                            <StarIcon className="w-5 h-5" />
                            <StarIcon className="w-5 h-5" />
                            <StarIcon className="w-5 h-5" />
                            <StarIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;