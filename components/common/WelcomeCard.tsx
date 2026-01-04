
import React from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import WalletIcon from '../icons/WalletIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import TargetIcon from '../icons/TargetIcon';

const WelcomeCard: React.FC<{ onAddTransaction: () => void }> = ({ onAddTransaction }) => {
    
    const ActionItem: React.FC<{icon: React.ElementType, title: string, description: string, to?: string, onClick?: () => void}> = ({icon: Icon, title, description, to, onClick}) => {
        const content = (
            <div className="flex items-start p-4 bg-light-bg dark:bg-dark-bg rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 dark:bg-secondary/20 flex items-center justify-center mr-4">
                    <Icon className="h-6 w-6 text-primary dark:text-secondary-light" />
                </div>
                <div>
                    <h4 className="font-bold text-light-text dark:text-dark-text">{title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>
        );

        if (to) {
            return <Link to={to}>{content}</Link>;
        }
        return <button onClick={onClick} className="w-full text-left">{content}</button>

    };

    return (
        <Card className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-dark-card shadow-lg">
            <div className="p-2">
                <h2 className="text-2xl font-bold text-center text-primary dark:text-secondary-light">Selamat Datang di Dompet Digital!</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mt-2 mb-6">Mari kita mulai mengatur keuangan Anda. Berikut beberapa langkah pertama:</p>
                
                <div className="space-y-4">
                    <ActionItem 
                        icon={WalletIcon}
                        title="Catat Transaksi Pertama"
                        description="Mulai lacak pemasukan atau pengeluaran Anda."
                        onClick={onAddTransaction}
                    />
                     <ActionItem 
                        icon={ClipboardListIcon}
                        title="Buat Anggaran Bulanan"
                        description="Atur batas pengeluaran untuk setiap kategori."
                        to="/planning"
                    />
                     <ActionItem 
                        icon={TargetIcon}
                        title="Tentukan Impian Finansial"
                        description="Mulai menabung untuk tujuan besar Anda."
                        to="/planning"
                    />
                </div>
            </div>
        </Card>
    );
};

export default WelcomeCard;
