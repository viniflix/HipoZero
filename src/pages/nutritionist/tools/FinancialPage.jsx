import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Target, Settings, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfMonth } from 'date-fns';
import Papa from 'papaparse';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/customSupabaseClient';

// Components
import FinancialKPIs from '@/components/financial/FinancialKPIs';
import FinancialCharts from '@/components/financial/FinancialCharts';
import TransactionList from '@/components/financial/TransactionList';
import TransactionDialog from '@/components/financial/TransactionDialog';
import ServicesManager from '@/components/financial/ServicesManager';
import PendingPaymentsWidget from '@/components/financial/PendingPaymentsWidget';
import TopPatientsWidget from '@/components/financial/TopPatientsWidget';

// Queries
import {
    getFinancialSummary,
    getTransactions,
    saveTransaction,
    saveMultipleTransactions,
    deleteTransaction,
    getCashFlowData,
    getExpenseDistribution,
    getProjectedCashFlow,
    getPatientsForAutocomplete,
    getServices
} from '@/lib/supabase/financial-queries';
import { exportFinancialsToPdf } from '@/lib/pdfUtils';
import { generateReceipt } from '@/lib/pdf/receiptGenerator';
import { exportFinancialReport } from '@/lib/utils/exportUtils';

export default function FinancialPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [summary, setSummary] = useState({ income: 0, expenses: 0, netResult: 0, overdue: 0 });
    const [transactions, setTransactions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [cashFlowData, setCashFlowData] = useState([]);
    const [expenseDistribution, setExpenseDistribution] = useState([]);
    const [projectedCashFlow, setProjectedCashFlow] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isServicesManagerOpen, setIsServicesManagerOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [filters, setFilters] = useState({ type: null, status: null, search: null });
    const [monthlyGoal, setMonthlyGoal] = useState(10000); // R$ 10.000,00 (editable)

    // Load all data
    const loadData = useCallback(async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const monthStart = startOfMonth(selectedMonth);
            
            // Load summary
            const summaryData = await getFinancialSummary(monthStart);
            setSummary(summaryData);

            // Load transactions
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth() + 1;
            const transactionsData = await getTransactions(
                user.id,
                { ...filters, month, year },
                { page: 1, pageSize: 100 },
                { field: 'transaction_date', order: 'desc' }
            );
            setTransactions(transactionsData.data);

            // Load charts data
            const [cashFlow, expenses, projection] = await Promise.all([
                getCashFlowData(user.id, monthStart, 'day'),
                getExpenseDistribution(user.id, monthStart),
                getProjectedCashFlow(user.id, new Date())
            ]);
            setCashFlowData(cashFlow);
            setExpenseDistribution(expenses);
            setProjectedCashFlow(projection);

            // Load patients (only once)
            if (patients.length === 0) {
                const patientsData = await getPatientsForAutocomplete(user.id);
                setPatients(patientsData);
            }

            // Load services (only once)
            if (services.length === 0) {
                const servicesData = await getServices(user.id);
                setServices(servicesData);
            }
        } catch (error) {
            console.error('Error loading financial data:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados financeiros.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [user, selectedMonth, filters, patients.length, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleNewTransaction = () => {
        setEditingTransaction(null);
        setIsDialogOpen(true);
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setIsDialogOpen(true);
    };

    const handleSaveTransaction = async (data) => {
        try {
            if (!user?.id) return;
            
            // Handle multiple transactions (installments)
            if (data.multiple && data.transactions) {
                const transactionsWithNutritionist = data.transactions.map(t => ({
                    ...t,
                    nutritionist_id: user.id
                }));
                
                await saveMultipleTransactions(transactionsWithNutritionist);
                
                toast({
                    title: "Sucesso!",
                    description: `${data.transactions.length} parcelas criadas com sucesso.`
                });
            } else {
                // Single transaction
                await saveTransaction({
                    ...data,
                    nutritionist_id: user.id
                });

                toast({
                    title: "Sucesso!",
                    description: `Transação ${data.id ? 'atualizada' : 'criada'} com sucesso.`
                });
            }

            setIsDialogOpen(false);
            setEditingTransaction(null);
            loadData();
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast({
                title: "Erro",
                description: `Não foi possível salvar a transação: ${error.message}`,
                variant: "destructive"
            });
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await deleteTransaction(id);
            toast({
                title: "Sucesso!",
                description: "Transação deletada com sucesso."
            });
            setDeleteConfirm(null);
            loadData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast({
                title: "Erro",
                description: "Não foi possível deletar a transação.",
                variant: "destructive"
            });
        }
    };

    const handleExportCSV = () => {
        const csvData = transactions.map(t => ({
            Data: format(new Date(t.transaction_date + 'T00:00:00'), 'dd/MM/yyyy'),
            Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
            Descrição: t.description,
            Categoria: t.category || '-',
            Paciente: t.patient?.name || '-',
            Valor: t.amount.toFixed(2),
            Status: t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Vencido'
        }));
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `financeiro_hipozero_${format(selectedMonth, 'yyyy-MM')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Exportado!",
            description: "Arquivo CSV baixado com sucesso."
        });
    };

    const handleExportReport = () => {
        try {
            exportFinancialReport(transactions, 'csv');
            toast({
                title: "Exportado!",
                description: "Relatório completo exportado para contador."
            });
        } catch (error) {
            console.error('Error exporting report:', error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível exportar o relatório.",
                variant: "destructive"
            });
        }
    };

    const handleGenerateReceipt = async (transaction) => {
        if (!user?.id) return;

        try {
            // Fetch nutritionist profile
            const { data: nutritionistProfile, error: nutritionistError } = await supabase
                .from('user_profiles')
                .select('name, crn, address, phone, email')
                .eq('id', user.id)
                .single();

            if (nutritionistError) {
                throw new Error('Não foi possível carregar os dados do nutricionista.');
            }

            // Fetch patient profile if patient_id exists
            let patientProfile = null;
            if (transaction.patient_id) {
                const { data: patient, error: patientError } = await supabase
                    .from('user_profiles')
                    .select('name, cpf')
                    .eq('id', transaction.patient_id)
                    .single();

                if (!patientError && patient) {
                    patientProfile = patient;
                }
            }

            // Generate receipt
            await generateReceipt(transaction, nutritionistProfile, patientProfile);
            
            toast({
                title: "Sucesso!",
                description: "Recibo gerado e baixado com sucesso."
            });
        } catch (error) {
            console.error('Error generating receipt:', error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível gerar o recibo.",
                variant: "destructive"
            });
        }
    };

    const handleExportPDF = () => {
        try {
            exportFinancialsToPdf(transactions, summary, format(selectedMonth, 'MMMM yyyy'));
            toast({
                title: "Exportado!",
                description: "Arquivo PDF gerado com sucesso."
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast({
                title: "Erro",
                description: "Não foi possível gerar o PDF.",
                variant: "destructive"
            });
        }
    };

    const goalProgress = useMemo(() => {
        if (monthlyGoal <= 0) return 0;
        return Math.min((summary.income / monthlyGoal) * 100, 100);
    }, [summary.income, monthlyGoal]);

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Financeiro</h1>
                            <p className="text-muted-foreground mt-1">
                                Gerencie receitas, despesas e acompanhe o fluxo de caixa
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => setIsServicesManagerOpen(true)} variant="outline" size="lg">
                                <Settings className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Gerenciar Serviços</span>
                                <span className="sm:hidden">Serviços</span>
                            </Button>
                            <Button onClick={handleExportReport} variant="outline" size="lg">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Exportar Relatório</span>
                                <span className="sm:hidden">Relatório</span>
                            </Button>
                            <Button onClick={handleNewTransaction} size="lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Transação
                            </Button>
                        </div>
                    </div>

                    {/* Pending Payments Widget */}
                    <PendingPaymentsWidget
                        nutritionistId={user?.id}
                        onUpdate={loadData}
                    />

                    {/* Month Selector & Export */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Input
                            type="month"
                            value={format(selectedMonth, 'yyyy-MM')}
                            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-02'))}
                            className="w-full sm:w-auto"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleExportPDF} variant="outline" className="flex-1 sm:flex-initial">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Exportar PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </Button>
                            <Button onClick={handleExportCSV} variant="outline" className="flex-1 sm:flex-initial">
                                <Download className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Exportar CSV</span>
                                <span className="sm:hidden">CSV</span>
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="mb-6">
                        <FinancialKPIs summary={summary} loading={loading} />
                    </div>

                    {/* Charts, Goals & Top Patients */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2">
                            <FinancialCharts
                                cashFlowData={cashFlowData}
                                expenseDistribution={expenseDistribution}
                                projectedCashFlow={projectedCashFlow}
                                loading={loading}
                            />
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Meta Financeira
                                    </CardTitle>
                                    <CardDescription>
                                        Meta mensal de receita
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="monthlyGoal" className="text-xs text-muted-foreground mb-1">
                                            Meta Mensal (R$)
                                        </Label>
                                        <Input
                                            id="monthlyGoal"
                                            type="number"
                                            step="100"
                                            min="0"
                                            value={monthlyGoal}
                                            onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                                            className="mb-3"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Progresso</span>
                                            <span className="font-semibold">
                                                {goalProgress.toFixed(1)}%
                                            </span>
                                        </div>
                                        <Progress value={goalProgress} className="h-2" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Receita Atual</span>
                                            <span className="font-semibold">
                                                R$ {summary.income.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Meta</span>
                                            <span className="font-semibold">
                                                R$ {monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                            <span className="text-muted-foreground">Faltam</span>
                                            <span className={`font-semibold ${
                                                monthlyGoal - summary.income > 0 
                                                    ? 'text-orange-600' 
                                                    : 'text-green-600'
                                            }`}>
                                                R$ {Math.max(0, monthlyGoal - summary.income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <TopPatientsWidget nutritionistId={user?.id} />
                        </div>
                    </div>

                    {/* Transaction List */}
                    <TransactionList
                        transactions={transactions}
                        loading={loading}
                        onEdit={handleEditTransaction}
                        onDelete={(id) => setDeleteConfirm(id)}
                        onGenerateReceipt={handleGenerateReceipt}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </motion.div>
            </main>

            {/* Transaction Dialog */}
            <TransactionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                transaction={editingTransaction}
                patients={patients}
                services={services}
                nutritionistId={user?.id}
                onSave={handleSaveTransaction}
            />

            {/* Services Manager */}
            <ServicesManager
                open={isServicesManagerOpen}
                onOpenChange={(open) => {
                    setIsServicesManagerOpen(open);
                    // Reload services when manager closes
                    if (!open && user?.id) {
                        getServices(user.id).then(setServices).catch(console.error);
                    }
                }}
                nutritionistId={user?.id}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteTransaction(deleteConfirm)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
