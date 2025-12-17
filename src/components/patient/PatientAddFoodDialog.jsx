import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/customSupabaseClient';
import CascadeMeasureSelector from '@/components/meal-plan/CascadeMeasureSelector';
import { calculateNutrition } from '@/lib/supabase/meal-plan-queries';
import { searchFoodsPaginated } from '@/lib/supabase/foodService';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * PatientAddFoodDialog - Modal para adicionar/editar alimento
 *
 * Usa sistema de medidas caseiras (CascadeMeasureSelector)
 * Compatível com sistema do nutricionista
 *
 * Modos:
 * - 'add': Buscar e adicionar novo alimento
 * - 'edit': Alterar medida de alimento existente
 */
const PatientAddFoodDialog = ({
    isOpen,
    onClose,
    onAdd,
    initialFood = null, // Para edição
    mode = 'add' // 'add' ou 'edit'
}) => {
    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [selectedMeasure, setSelectedMeasure] = useState(null);
    const [notes, setNotes] = useState('');
    const [calculatedNutrition, setCalculatedNutrition] = useState(null);
    const [errors, setErrors] = useState({});

    // Estados para busca de alimentos com paginação
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef(null);
    
    // Debounce search term (500ms)
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        if (initialFood && mode === 'edit') {
            setSelectedFood(initialFood);
            setQuantity(initialFood.quantity?.toString() || '');
            setUnit(initialFood.unit || '');
            setNotes(initialFood.notes || '');
        }
    }, [initialFood, mode]);

    // Buscar alimentos com paginação
    const handleSearchFoods = useCallback(async (targetPage = 0, append = false) => {
        if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
            setSearchResults([]);
            setHasMore(false);
            return;
        }

        const isLoadingMore = append && targetPage > 0;

        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setSearching(true);
        }

        try {
            const result = await searchFoodsPaginated(debouncedSearchTerm, targetPage);
            
            if (append) {
                setSearchResults(prev => [...prev, ...result.data]);
            } else {
                setSearchResults(result.data);
            }
            
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Erro ao buscar alimentos:', error);
            if (!append) {
                setSearchResults([]);
            }
            setHasMore(false);
        } finally {
            setSearching(false);
            setLoadingMore(false);
        }
    }, [debouncedSearchTerm]);

    // Reset and search when debounced term changes
    useEffect(() => {
        setPage(0);
        setSearchResults([]);
        if (debouncedSearchTerm.trim().length >= 2) {
            handleSearchFoods(0, false);
        } else {
            setSearchResults([]);
            setHasMore(false);
        }
    }, [debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load more function
    const loadMore = useCallback(() => {
        if (hasMore && !searching && !loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            handleSearchFoods(nextPage, true);
        }
    }, [hasMore, searching, loadingMore, page, handleSearchFoods]);

    // Infinite scroll with IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [loadMore]);

    const handleFoodSelect = (food) => {
        setSelectedFood(food);
        setSearchTerm('');
        setSearchResults([]);
        // Resetar quantidade e unidade ao trocar alimento
        setQuantity('');
        setUnit('');
        setCalculatedNutrition(null);
    };

    const handleNutritionCalculated = (nutrition) => {
        setCalculatedNutrition(nutrition);
    };

    const validate = () => {
        const newErrors = {};

        if (!selectedFood) {
            newErrors.food = 'Selecione um alimento';
        }

        if (!quantity || parseFloat(quantity) <= 0) {
            newErrors.quantity = 'Quantidade deve ser maior que zero';
        }

        if (!unit) {
            newErrors.unit = 'Selecione uma medida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAdd = () => {
        if (!validate()) return;

        const foodData = {
            id: Date.now(), // ID único para novo alimento
            food_id: selectedFood.id,
            food_name: selectedFood.name,
            quantity: parseFloat(quantity),
            unit,
            measure: selectedMeasure, // Objeto measure completo
            // Base values para recálculo futuro
            base_calories: selectedFood.calories || 0,
            base_protein: selectedFood.protein || 0,
            base_carbs: selectedFood.carbs || 0,
            base_fat: selectedFood.fat || 0,
            // Valores calculados
            calories: calculatedNutrition?.calories || 0,
            protein: calculatedNutrition?.protein || 0,
            carbs: calculatedNutrition?.carbs || 0,
            fat: calculatedNutrition?.fat || 0,
            notes: notes.trim() || null
        };

        // Se for edição, preservar list_item_id
        if (mode === 'edit' && initialFood?.list_item_id) {
            foodData.list_item_id = initialFood.list_item_id;
        }

        onAdd(foodData);
        handleClose();
    };

    const handleClose = () => {
        setSelectedFood(null);
        setQuantity('');
        setUnit('');
        setNotes('');
        setCalculatedNutrition(null);
        setErrors({});
        setSearchTerm('');
        setSearchResults([]);
        setPage(0);
        setHasMore(false);
        setLoadingMore(false);
        onClose();
    };

    const showSearch = mode === 'add' && !selectedFood;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Editar Alimento' : 'Adicionar Alimento'}
                    </DialogTitle>
                    <DialogDescription>
                        Use medidas caseiras para facilitar o registro
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Seletor de Alimento */}
                    <div className="space-y-2">
                        <Label>
                            Alimento <span className="text-destructive">*</span>
                        </Label>
                        {selectedFood ? (
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                <div className="flex-1">
                                    <div className="font-semibold">{selectedFood.name}</div>
                                    {selectedFood.group && (
                                        <div className="text-sm text-muted-foreground">
                                            {selectedFood.group}
                                        </div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Base 100g: {selectedFood.calories} kcal |
                                        P: {selectedFood.protein}g |
                                        C: {selectedFood.carbs}g |
                                        G: {selectedFood.fat}g
                                    </div>
                                </div>
                                {mode !== 'edit' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFood(null)}
                                    >
                                        Trocar
                                    </Button>
                                )}
                            </div>
                        ) : showSearch ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar alimento..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Resultados da busca */}
                                {searchTerm.length >= 2 && (
                                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                                        {searching && searchResults.length === 0 ? (
                                            // Loading skeleton for initial search
                                            <div className="divide-y">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="p-3 animate-pulse">
                                                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                                        <div className="h-3 bg-muted rounded w-1/2"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : searchResults.length === 0 && !searching ? (
                                            <div className="p-4 text-center text-muted-foreground">
                                                Nenhum alimento encontrado
                                            </div>
                                        ) : (
                                            <>
                                                <div className="divide-y">
                                                    {searchResults.map((food) => (
                                                        <div
                                                            key={food.id}
                                                            className="p-3 hover:bg-accent cursor-pointer transition-colors"
                                                            onClick={() => handleFoodSelect(food)}
                                                        >
                                                            <div className="font-medium">{food.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {food.group} • {food.calories} kcal/100g
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Infinite scroll trigger */}
                                                {hasMore && (
                                                    <div ref={observerTarget} className="p-3 text-center">
                                                        {loadingMore ? (
                                                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                <span className="text-xs">Carregando mais...</span>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={loadMore}
                                                                className="text-xs"
                                                            >
                                                                Carregar mais
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                        {errors.food && (
                            <p className="text-xs text-destructive">{errors.food}</p>
                        )}
                    </div>

                    {/* Seletor de Medidas Caseiras */}
                    {selectedFood && (
                        <>
                            <div className="space-y-2">
                                <CascadeMeasureSelector
                                    food={selectedFood}
                                    quantity={quantity}
                                    unit={unit}
                                    onQuantityChange={setQuantity}
                                    onUnitChange={setUnit}
                                    onMeasureChange={setSelectedMeasure}
                                    onNutritionCalculated={handleNutritionCalculated}
                                />
                                {errors.quantity && (
                                    <p className="text-xs text-destructive">{errors.quantity}</p>
                                )}
                                {errors.unit && (
                                    <p className="text-xs text-destructive">{errors.unit}</p>
                                )}
                            </div>

                            {/* Valores Nutricionais Calculados */}
                            {calculatedNutrition && (
                                <Alert className="bg-primary/5">
                                    <AlertDescription>
                                        <div className="font-semibold mb-2">Valores Nutricionais:</div>
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Calorias</div>
                                                <div className="font-bold text-lg">{calculatedNutrition.calories}</div>
                                                <div className="text-xs text-muted-foreground">kcal</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Proteínas</div>
                                                <div className="font-bold text-lg">{calculatedNutrition.protein}</div>
                                                <div className="text-xs text-muted-foreground">g</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Carboidratos</div>
                                                <div className="font-bold text-lg">{calculatedNutrition.carbs}</div>
                                                <div className="text-xs text-muted-foreground">g</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Gorduras</div>
                                                <div className="font-bold text-lg">{calculatedNutrition.fat}</div>
                                                <div className="text-xs text-muted-foreground">g</div>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Observações */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações (opcional)</Label>
                                <Textarea
                                    id="notes"
                                    rows={2}
                                    placeholder="Ex: sem sal, bem cozido, etc."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button onClick={handleAdd} disabled={!selectedFood || !quantity || !unit}>
                        <Plus className="h-4 w-4 mr-2" />
                        {mode === 'edit' ? 'Atualizar' : 'Adicionar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PatientAddFoodDialog;
