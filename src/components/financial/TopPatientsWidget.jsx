import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

export default function TopPatientsWidget({ nutritionistId }) {
    const [topPatients, setTopPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (nutritionistId) {
            loadTopPatients();
        }
    }, [nutritionistId]);

    const loadTopPatients = async () => {
        if (!nutritionistId) return;
        setLoading(true);
        try {
            // Fetch all paid income transactions
            const { data: transactions, error } = await supabase
                .from('financial_transactions')
                .select(`
                    patient_id,
                    amount,
                    patient:user_profiles!financial_transactions_patient_id_fkey(
                        id,
                        name,
                        avatar_url,
                        cpf
                    )
                `)
                .eq('nutritionist_id', nutritionistId)
                .eq('type', 'income')
                .eq('status', 'paid')
                .not('patient_id', 'is', null);

            if (error) {
                console.error('Error loading top patients:', error);
                return;
            }

            // Group by patient_id and sum amounts
            const patientTotals = {};
            transactions.forEach(transaction => {
                if (!transaction.patient_id) return;
                
                const patientId = transaction.patient_id;
                if (!patientTotals[patientId]) {
                    patientTotals[patientId] = {
                        patient: transaction.patient,
                        total: 0
                    };
                }
                patientTotals[patientId].total += parseFloat(transaction.amount || 0);
            });

            // Convert to array, sort by total, and take top 5
            const sorted = Object.values(patientTotals)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            setTopPatients(sorted);
        } catch (error) {
            console.error('Error loading top patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getRankIcon = (rank) => {
        if (rank === 0) return '🥇';
        if (rank === 1) return '🥈';
        if (rank === 2) return '🥉';
        return `#${rank + 1}`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top Pacientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-muted-foreground">
                        Carregando...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (topPatients.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top Pacientes
                    </CardTitle>
                    <CardDescription>
                        Maiores contribuidores (LTV)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-muted-foreground">
                        Nenhum dado disponível
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Top Pacientes
                </CardTitle>
                <CardDescription>
                    Maiores contribuidores (LTV - Lifetime Value)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topPatients.map((item, index) => (
                        <div
                            key={item.patient?.id || index}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex-shrink-0">
                                <Badge 
                                    variant={index < 3 ? "default" : "secondary"}
                                    className="w-8 h-8 flex items-center justify-center p-0 text-xs font-bold"
                                >
                                    {getRankIcon(index)}
                                </Badge>
                            </div>
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={item.patient?.avatar_url} alt={item.patient?.name} />
                                <AvatarFallback>
                                    {getInitials(item.patient?.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                    {item.patient?.name || 'Paciente não identificado'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total investido
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="font-bold text-lg text-primary">
                                    {formatCurrency(item.total)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

