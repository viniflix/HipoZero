import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Database, Package, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FoodCard from '@/components/nutrition/FoodCard';
import FoodDetailsDialog from '@/components/nutrition/FoodDetailsDialog';
import SmartFoodForm from '@/components/nutrition/SmartFoodForm';
import { useDebounce } from '@/hooks/useDebounce';

const FoodBankPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedFood, setSelectedFood] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [foodToEdit, setFoodToEdit] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [foodToDelete, setFoodToDelete] = useState(null);
    
    // Debounce search
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Source options
    const sourceOptions = [
        { value: 'all', label: 'Todas as Fontes' },
        { value: 'custom', label: 'Meus Alimentos Personalizados' },
        { value: 'TACO', label: 'TACO' },
        { value: 'IBGE', label: 'IBGE' },
        { value: 'USDA', label: 'USDA' },
        { value: 'Tucunduva', label: 'Tucunduva' },
        { value: 'TBCA', label: 'TBCA' }
    ];

    // Fetch foods
    const fetchFoods = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('foods')
                .select('*, food_measures(*)')
                .eq('is_active', true)
                .order('source', { ascending: true })
                .order('name', { ascending: true });

            // Filter by source
            if (sourceFilter !== 'all') {
                if (sourceFilter === 'custom') {
                    query = query.eq('nutritionist_id', user.id);
                } else {
                    query = query.eq('source', sourceFilter);
                }
            } else {
                // Include custom foods from this nutritionist
                query = query.or(`source.eq.custom,nutritionist_id.eq.${user.id},source.neq.custom`);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            setFoods(data || []);
        } catch (error) {
            console.error('Erro ao buscar alimentos:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os alimentos.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }, [user.id, sourceFilter, toast]);

    useEffect(() => {
        fetchFoods();
    }, [fetchFoods]);

    // Filter and search foods
    const filteredFoods = useMemo(() => {
        let filtered = foods;

        // Apply search filter
        if (debouncedSearchTerm.trim()) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(food =>
                food.name.toLowerCase().includes(searchLower) ||
                (food.group && food.group.toLowerCase().includes(searchLower)) ||
                (food.description && food.description.toLowerCase().includes(searchLower))
            );
        }

        // Separate custom foods from others
        const customFoods = filtered.filter(food => 
            food.source === 'custom' || food.nutritionist_id === user.id
        );
        const otherFoods = filtered.filter(food => 
            food.source !== 'custom' && food.nutritionist_id !== user.id
        );

        return { customFoods, otherFoods, all: filtered };
    }, [foods, debouncedSearchTerm, user.id]);

    // Handle view details
    const handleViewDetails = (food) => {
        setSelectedFood(food);
        setDetailsDialogOpen(true);
    };

    // Handle edit
    const handleEdit = (food) => {
        setFoodToEdit(food);
        setEditDialogOpen(true);
    };

    // Handle delete
    const handleDeleteClick = (food) => {
        setFoodToDelete(food);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!foodToDelete) return;

        try {
            const { error } = await supabase
                .from('foods')
                .delete()
                .eq('id', foodToDelete.id);

            if (error) throw error;

            toast({
                title: 'Sucesso!',
                description: 'Alimento excluído com sucesso.',
            });

            fetchFoods();
            setDeleteConfirmOpen(false);
            setFoodToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir alimento:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir o alimento.',
                variant: 'destructive'
            });
        }
    };

    // Handle create success
    const handleCreateSuccess = () => {
        setCreateDialogOpen(false);
        fetchFoods();
        toast({
            title: 'Sucesso!',
            description: 'Alimento criado com sucesso.',
        });
    };

    // Handle edit success
    const handleEditSuccess = () => {
        setEditDialogOpen(false);
        setFoodToEdit(null);
        fetchFoods();
        toast({
            title: 'Sucesso!',
            description: 'Alimento atualizado com sucesso.',
        });
    };

    // Stats
    const stats = useMemo(() => {
        const customCount = foods.filter(f => 
            f.source === 'custom' || f.nutritionist_id === user.id
        ).length;
        const totalCount = foods.length;
        return { custom: customCount, total: totalCount };
    }, [foods, user.id]);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 pb-12 space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <Database className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold text-foreground">
                                Banco de Alimentos
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            Gerencie seus alimentos personalizados e consulte o banco público de alimentos
                        </p>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Alimento
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Meus Alimentos Personalizados
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{stats.custom}</p>
                                </div>
                                <Package className="w-10 h-10 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total de Alimentos
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                                </div>
                                <Database className="w-10 h-10 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar alimento por nome, grupo ou descrição..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                    <SelectTrigger className="w-full sm:w-[250px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filtrar por fonte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sourceOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {searchTerm && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {filteredFoods.all.length} resultado(s) encontrado(s)
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Limpar busca
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {loading ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Carregando alimentos...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="all">
                                Todos ({filteredFoods.all.length})
                            </TabsTrigger>
                            <TabsTrigger value="custom">
                                Meus Alimentos ({filteredFoods.customFoods.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: All Foods */}
                        <TabsContent value="all" className="space-y-6 mt-6">
                            {/* Custom Foods Section - Always First */}
                            {filteredFoods.customFoods.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-emerald-600" />
                                        <h2 className="text-xl font-semibold">
                                            Meus Alimentos Personalizados
                                        </h2>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                            {filteredFoods.customFoods.length}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredFoods.customFoods.map((food) => (
                                            <FoodCard
                                                key={food.id}
                                                food={food}
                                                isCustom={true}
                                                onView={handleViewDetails}
                                                onEdit={handleEdit}
                                                onDelete={handleDeleteClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Foods Section */}
                            {filteredFoods.otherFoods.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Database className="w-5 h-5 text-primary" />
                                        <h2 className="text-xl font-semibold">
                                            Banco de Dados Público
                                        </h2>
                                        <Badge variant="outline">
                                            {filteredFoods.otherFoods.length}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredFoods.otherFoods.map((food) => (
                                            <FoodCard
                                                key={food.id}
                                                food={food}
                                                isCustom={false}
                                                onView={handleViewDetails}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {filteredFoods.all.length === 0 && (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            {searchTerm
                                                ? `Nenhum alimento encontrado para "${searchTerm}"`
                                                : 'Nenhum alimento encontrado'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Tab: Custom Foods Only */}
                        <TabsContent value="custom" className="space-y-6 mt-6">
                            {filteredFoods.customFoods.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredFoods.customFoods.map((food) => (
                                        <FoodCard
                                            key={food.id}
                                            food={food}
                                            isCustom={true}
                                            onView={handleViewDetails}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Você ainda não criou nenhum alimento personalizado
                                        </p>
                                        <Button onClick={() => setCreateDialogOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Criar Primeiro Alimento
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </motion.div>

            {/* Food Details Dialog */}
            <FoodDetailsDialog
                food={selectedFood}
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
            />

            {/* Create Food Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Novo Alimento Personalizado
                        </DialogTitle>
                        <DialogDescription>
                            Crie um alimento customizado com busca por código de barras e cálculo automático
                        </DialogDescription>
                    </DialogHeader>
                    <SmartFoodForm
                        mode="full"
                        onSuccess={handleCreateSuccess}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Food Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Editar Alimento
                        </DialogTitle>
                        <DialogDescription>
                            Edite as informações nutricionais e medidas caseiras
                        </DialogDescription>
                    </DialogHeader>
                    {foodToEdit && (
                        <SmartFoodForm
                            mode="full"
                            initialData={foodToEdit}
                            onSuccess={handleEditSuccess}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o alimento "{foodToDelete?.name}"? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setFoodToDelete(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Excluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FoodBankPage;
