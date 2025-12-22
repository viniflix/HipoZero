import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Plus, X, Calculator, Barcode, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { createFood } from '@/lib/supabase/foodService';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * SmartFoodForm - Formulário inteligente e intuitivo para criar/editar alimentos
 * 
 * Features:
 * - Busca por código de barras (OpenFoodFacts)
 * - Auto-cálculo de calorias baseado em macros
 * - Conversão automática de porção do rótulo para 100g
 * - Suporte completo a micronutrientes
 * - Layout organizado em tabs para melhor UX
 * - Adição rápida de medidas caseiras comuns
 * 
 * @param {Object} props
 * @param {Object} props.initialData - Dados iniciais (para edição)
 * @param {Function} props.onSuccess - Callback quando alimento é criado/editado
 * @param {string} props.mode - 'compact' | 'full' (layout mode)
 * @param {string} props.initialName - Nome inicial (para quick-add)
 */
const SmartFoodForm = forwardRef(function SmartFoodForm({ 
    initialData = null,
    onSuccess,
    mode = 'full',
    initialName = ''
}, ref) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    // Basic Info
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    
    // Input Mode
    const [inputMode, setInputMode] = useState('100g'); // '100g' | 'portion'
    const [labelPortionSize, setLabelPortionSize] = useState(100);
    
    // Macronutrients
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [calories, setCalories] = useState('');
    const [autoCalcCalories, setAutoCalcCalories] = useState(true);
    
    // Additional Macronutrients
    const [fiber, setFiber] = useState('');
    const [sugar, setSugar] = useState('');
    const [saturatedFat, setSaturatedFat] = useState('');
    const [transFat, setTransFat] = useState('');
    const [monounsaturatedFat, setMonounsaturatedFat] = useState('');
    const [polyunsaturatedFat, setPolyunsaturatedFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    
    // Minerals
    const [calcium, setCalcium] = useState('');
    const [iron, setIron] = useState('');
    const [magnesium, setMagnesium] = useState('');
    const [phosphorus, setPhosphorus] = useState('');
    const [potassium, setPotassium] = useState('');
    const [zinc, setZinc] = useState('');
    
    // Vitamins
    const [vitaminA, setVitaminA] = useState('');
    const [vitaminC, setVitaminC] = useState('');
    const [vitaminD, setVitaminD] = useState('');
    const [vitaminE, setVitaminE] = useState('');
    const [vitaminB12, setVitaminB12] = useState('');
    const [folate, setFolate] = useState('');
    
    // Other
    const [householdMeasures, setHouseholdMeasures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const [showMicronutrients, setShowMicronutrients] = useState(false);

    // Pre-fill from initialData (for editing) or initialName (for quick-add)
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setBrand(initialData.description?.replace('Marca: ', '') || '');
            setProtein(initialData.protein?.toString() || '');
            setCarbs(initialData.carbs?.toString() || '');
            setFat(initialData.fat?.toString() || '');
            setCalories(initialData.calories?.toString() || '');
            setFiber(initialData.fiber?.toString() || '');
            setSodium(initialData.sodium?.toString() || '');
            setSugar(initialData.sugar?.toString() || '');
            setSaturatedFat(initialData.saturated_fat?.toString() || '');
            setTransFat(initialData.trans_fat?.toString() || '');
            setMonounsaturatedFat(initialData.monounsaturated_fat?.toString() || '');
            setPolyunsaturatedFat(initialData.polyunsaturated_fat?.toString() || '');
            setCholesterol(initialData.cholesterol?.toString() || '');
            setCalcium(initialData.calcium?.toString() || '');
            setIron(initialData.iron?.toString() || '');
            setMagnesium(initialData.magnesium?.toString() || '');
            setPhosphorus(initialData.phosphorus?.toString() || '');
            setPotassium(initialData.potassium?.toString() || '');
            setZinc(initialData.zinc?.toString() || '');
            setVitaminA(initialData.vitamin_a?.toString() || '');
            setVitaminC(initialData.vitamin_c?.toString() || '');
            setVitaminD(initialData.vitamin_d?.toString() || '');
            setVitaminE(initialData.vitamin_e?.toString() || '');
            setVitaminB12(initialData.vitamin_b12?.toString() || '');
            setFolate(initialData.folate?.toString() || '');
            setAutoCalcCalories(false);
            setInputMode('100g');
            
            // Show micronutrients if any exist
            if (initialData.fiber || initialData.sodium || initialData.calcium || initialData.iron) {
                setShowMicronutrients(true);
            }
        } else if (initialName) {
            setName(initialName);
        }
    }, [initialData, initialName]);

    // Calculate normalized values (for 100g) when in portion mode
    const normalizedValues = useMemo(() => {
        if (inputMode === 'portion' && labelPortionSize > 0) {
            const factor = 100 / labelPortionSize;
            return {
                protein: protein ? ((parseFloat(protein) || 0) * factor).toFixed(2) : '',
                carbs: carbs ? ((parseFloat(carbs) || 0) * factor).toFixed(2) : '',
                fat: fat ? ((parseFloat(fat) || 0) * factor).toFixed(2) : '',
                calories: calories ? ((parseFloat(calories) || 0) * factor).toFixed(2) : ''
            };
        }
        return null;
    }, [inputMode, labelPortionSize, protein, carbs, fat, calories]);

    // Auto-calculate calories when macros change
    useEffect(() => {
        if (autoCalcCalories && protein && carbs && fat) {
            let proteinVal = parseFloat(protein) || 0;
            let carbsVal = parseFloat(carbs) || 0;
            let fatVal = parseFloat(fat) || 0;
            
            const calculated = (proteinVal * 4) + (carbsVal * 4) + (fatVal * 9);
            setCalories(Math.round(calculated * 100) / 100);
        }
    }, [protein, carbs, fat, autoCalcCalories, inputMode, labelPortionSize]);

    // Helper function to normalize a value based on input mode
    const normalizeValue = (value) => {
        if (!value) return null;
        if (inputMode === 'portion' && labelPortionSize > 0) {
            const factor = 100 / labelPortionSize;
            return parseFloat(value) * factor;
        }
        return parseFloat(value);
    };

    // Pre-defined common household measures
    const commonMeasures = [
        { label: 'Colher de Sopa', grams: 15 },
        { label: 'Colher de Chá', grams: 5 },
        { label: 'Xícara', grams: 200 },
        { label: 'Unidade', grams: 1 },
        { label: 'Fatia', grams: 30 },
        { label: 'Colher de Servir', grams: 20 }
    ];

    const handleAddMeasure = (measure) => {
        const exists = householdMeasures.some(m => m.label === measure.label);
        if (exists) {
            toast({
                title: 'Medida já adicionada',
                description: `${measure.label} já está na lista.`,
                variant: 'default'
            });
            return;
        }
        setHouseholdMeasures([...householdMeasures, measure]);
    };

    const handleRemoveMeasure = (index) => {
        setHouseholdMeasures(householdMeasures.filter((_, i) => i !== index));
    };

    // Fetch product from OpenFoodFacts API
    const handleFetchBarcode = async () => {
        if (!barcode.trim()) {
            toast({
                title: 'Erro',
                description: 'Digite um código de barras válido.',
                variant: 'destructive'
            });
            return;
        }

        setBarcodeLoading(true);
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode.trim()}.json`);
            const data = await response.json();

            if (data.status === 0 || !data.product) {
                toast({
                    title: 'Produto não encontrado',
                    description: 'Não foi possível encontrar este produto no OpenFoodFacts.',
                    variant: 'default'
                });
                return;
            }

            const product = data.product;
            const nutriments = product.nutriments || {};

            if (product.product_name) setName(product.product_name);
            if (product.brands) setBrand(product.brands.split(',')[0].trim());
            if (nutriments.proteins_100g !== undefined) setProtein(nutriments.proteins_100g.toString());
            if (nutriments.carbohydrates_100g !== undefined) setCarbs(nutriments.carbohydrates_100g.toString());
            if (nutriments.fat_100g !== undefined) setFat(nutriments.fat_100g.toString());
            if (nutriments.fiber_100g !== undefined) setFiber(nutriments.fiber_100g.toString());
            if (nutriments.sodium_100g !== undefined) setSodium((nutriments.sodium_100g * 1000).toString()); // Convert to mg
            if (nutriments.sugars_100g !== undefined) setSugar(nutriments.sugars_100g.toString());
            if (nutriments.saturated_fat_100g !== undefined) setSaturatedFat(nutriments.saturated_fat_100g.toString());
            if (nutriments.calcium_100g !== undefined) setCalcium((nutriments.calcium_100g * 1000).toString()); // Convert to mg
            if (nutriments.iron_100g !== undefined) setIron((nutriments.iron_100g * 1000).toString()); // Convert to mg
            if (nutriments.vitamin_c_100g !== undefined) setVitaminC((nutriments.vitamin_c_100g * 1000).toString()); // Convert to mg

            if (nutriments.energy_kcal_100g !== undefined) {
                setCalories(nutriments.energy_kcal_100g.toString());
                setAutoCalcCalories(false);
            } else if (nutriments.energy_100g !== undefined) {
                const kcal = nutriments.energy_100g / 4.184;
                setCalories(kcal.toFixed(2));
                setAutoCalcCalories(false);
            }

            setInputMode('100g');
            setLabelPortionSize(100);

            toast({
                title: 'Produto encontrado!',
                description: 'Campos preenchidos automaticamente.',
            });
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível buscar o produto. Verifique sua conexão.',
                variant: 'destructive'
            });
        } finally {
            setBarcodeLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({
                title: 'Erro',
                description: 'Nome do alimento é obrigatório.',
                variant: 'destructive'
            });
            return;
        }

        if (!protein || !carbs || !fat || !calories) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os valores nutricionais básicos (Proteína, Carboidratos, Gorduras, Calorias).',
                variant: 'destructive'
            });
            return;
        }

        if (inputMode === 'portion' && (!labelPortionSize || parseFloat(labelPortionSize) <= 0)) {
            toast({
                title: 'Erro',
                description: 'Informe o tamanho da porção do rótulo.',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            // Normalize all values to 100g base if in portion mode
            const normalize = (val) => val ? normalizeValue(val) : null;
            
            const foodData = {
                name: name.trim(),
                description: brand.trim() ? `Marca: ${brand.trim()}` : null,
                calories: Math.round(normalize(calories) * 100) / 100,
                protein: Math.round(normalize(protein) * 100) / 100,
                carbs: Math.round(normalize(carbs) * 100) / 100,
                fat: Math.round(normalize(fat) * 100) / 100,
                fiber: normalize(fiber),
                sodium: normalize(sodium),
                sugar: normalize(sugar),
                saturated_fat: normalize(saturatedFat),
                trans_fat: normalize(transFat),
                monounsaturated_fat: normalize(monounsaturatedFat),
                polyunsaturated_fat: normalize(polyunsaturatedFat),
                cholesterol: normalize(cholesterol),
                calcium: normalize(calcium),
                iron: normalize(iron),
                magnesium: normalize(magnesium),
                phosphorus: normalize(phosphorus),
                potassium: normalize(potassium),
                zinc: normalize(zinc),
                vitamin_a: normalize(vitaminA),
                vitamin_c: normalize(vitaminC),
                vitamin_d: normalize(vitaminD),
                vitamin_e: normalize(vitaminE),
                vitamin_b12: normalize(vitaminB12),
                folate: normalize(folate),
                portion_size: 100,
                source: 'custom',
                nutritionist_id: user?.id || null,
                group: 'Personalizado',
                is_active: true
            };

            let createdFood;

            if (initialData) {
                const { data, error } = await supabase
                    .from('foods')
                    .update(foodData)
                    .eq('id', initialData.id)
                    .select('id, name, group, description, source, calories, protein, carbs, fat, fiber, sodium, portion_size')
                    .single();

                if (error) throw error;
                createdFood = data;
            } else {
                const { data, error } = await createFood(foodData);
                if (error) throw error;
                if (!data) throw new Error('Alimento criado mas não retornado');
                createdFood = data;
            }

            // Create household measures
            if (householdMeasures.length > 0) {
                if (initialData) {
                    await supabase
                        .from('food_measures')
                        .delete()
                        .eq('food_id', createdFood.id);
                }

                const measuresToInsert = householdMeasures.map(measure => ({
                    food_id: createdFood.id,
                    measure_label: measure.label,
                    quantity_grams: measure.grams
                }));

                const { error: measuresError } = await supabase
                    .from('food_measures')
                    .insert(measuresToInsert);

                if (measuresError) {
                    console.warn('Erro ao criar medidas caseiras:', measuresError);
                }
            }

            toast({
                title: initialData ? 'Alimento atualizado!' : 'Alimento criado!',
                description: `${name} foi ${initialData ? 'atualizado' : 'adicionado'} ao banco de dados.`,
            });

            if (onSuccess) {
                onSuccess(createdFood);
            }
        } catch (error) {
            console.error('Erro ao salvar alimento:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível salvar o alimento.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        submit: handleSubmit
    }));

    const isCompact = mode === 'compact';

    return (
        <div className={isCompact ? "space-y-3" : "space-y-6"}>
            {/* Barcode Search - Only in full mode */}
            {!isCompact && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Barcode className="h-4 w-4" />
                            Buscar por Código de Barras
                        </CardTitle>
                        <CardDescription>
                            Busca automática de dados nutricionais via OpenFoodFacts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Digite o código EAN (ex: 7891000100103)"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleFetchBarcode();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleFetchBarcode}
                                disabled={barcodeLoading || !barcode.trim()}
                                variant="outline"
                            >
                                {barcodeLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Barcode className="h-4 w-4 mr-2" />
                                        Buscar
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Form Tabs */}
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="macros">Macronutrientes</TabsTrigger>
                    <TabsTrigger value="micros">Micronutrientes</TabsTrigger>
                </TabsList>

                {/* TAB 1: Basic Info */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informações Básicas</CardTitle>
                            <CardDescription>
                                Dados essenciais do alimento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome do Alimento <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Bolo de Chocolate"
                                    autoFocus={!initialData}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca (opcional)</Label>
                                <Input
                                    id="brand"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    placeholder="Ex: Marca X"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Household Measures */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Medidas Caseiras</CardTitle>
                            <CardDescription>
                                Adicione medidas caseiras comuns para facilitar o uso
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {commonMeasures.map((measure, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                                        onClick={() => handleAddMeasure(measure)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {measure.label} ({measure.grams}g)
                                    </Badge>
                                ))}
                            </div>

                            {householdMeasures.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm">Medidas Adicionadas:</Label>
                                    <div className="space-y-2">
                                        {householdMeasures.map((measure, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                                            >
                                                <span className="text-sm">
                                                    {measure.label} - {measure.grams}g
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveMeasure(idx)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: Macronutrients */}
                <TabsContent value="macros" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Macronutrientes
                            </CardTitle>
                            <CardDescription>
                                Valores nutricionais principais do alimento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Input Mode Tabs */}
                            <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="100g">Dados por 100g</TabsTrigger>
                                    <TabsTrigger value="portion">Dados do Rótulo (Porção)</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="100g" className="space-y-4 mt-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            Informe os valores nutricionais por 100g do alimento
                                        </p>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="portion" className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="labelPortionSize">
                                            Tamanho da Porção do Rótulo (g) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="labelPortionSize"
                                            type="number"
                                            value={labelPortionSize}
                                            onChange={(e) => setLabelPortionSize(e.target.value)}
                                            placeholder="Ex: 30"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Informe o tamanho da porção indicada no rótulo
                                        </p>
                                    </div>
                                    {normalizedValues && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                                                Equivalente por 100g:
                                            </p>
                                            <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                                                <p>Proteína: {normalizedValues.protein}g</p>
                                                <p>Carboidratos: {normalizedValues.carbs}g</p>
                                                <p>Gorduras: {normalizedValues.fat}g</p>
                                                {normalizedValues.calories && (
                                                    <p>Calorias: {normalizedValues.calories} kcal</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Main Macros */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="protein">
                                        Proteína (g) <span className="text-destructive">*</span>
                                        {inputMode === 'portion' && labelPortionSize > 0 && (
                                            <span className="text-xs text-muted-foreground block">
                                                por {labelPortionSize}g
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="protein"
                                        type="number"
                                        step="0.1"
                                        value={protein}
                                        onChange={(e) => setProtein(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="carbs">
                                        Carboidratos (g) <span className="text-destructive">*</span>
                                        {inputMode === 'portion' && labelPortionSize > 0 && (
                                            <span className="text-xs text-muted-foreground block">
                                                por {labelPortionSize}g
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="carbs"
                                        type="number"
                                        step="0.1"
                                        value={carbs}
                                        onChange={(e) => setCarbs(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fat">
                                        Gorduras (g) <span className="text-destructive">*</span>
                                        {inputMode === 'portion' && labelPortionSize > 0 && (
                                            <span className="text-xs text-muted-foreground block">
                                                por {labelPortionSize}g
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="fat"
                                        type="number"
                                        step="0.1"
                                        value={fat}
                                        onChange={(e) => setFat(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Calories */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="calories">
                                        Calorias (kcal) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="autoCalc"
                                            checked={autoCalcCalories}
                                            onChange={(e) => setAutoCalcCalories(e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <Label htmlFor="autoCalc" className="text-sm font-normal cursor-pointer">
                                            Calcular automaticamente
                                        </Label>
                                    </div>
                                </div>
                                <Input
                                    id="calories"
                                    type="number"
                                    step="0.1"
                                    value={calories}
                                    onChange={(e) => {
                                        setCalories(e.target.value);
                                        setAutoCalcCalories(false);
                                    }}
                                    placeholder="0"
                                    disabled={autoCalcCalories}
                                    className={autoCalcCalories ? 'bg-muted' : ''}
                                />
                                {autoCalcCalories && (
                                    <p className="text-xs text-muted-foreground">
                                        Cálculo: (Proteína × 4) + (Carboidratos × 4) + (Gorduras × 9)
                                    </p>
                                )}
                            </div>

                            {/* Additional Macronutrients */}
                            <Collapsible open={showMicronutrients} onOpenChange={setShowMicronutrients}>
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                                    <span className="text-sm font-medium">Gorduras Detalhadas e Outros (opcional)</span>
                                    {showMicronutrients ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fiber">Fibra (g)</Label>
                                            <Input
                                                id="fiber"
                                                type="number"
                                                step="0.1"
                                                value={fiber}
                                                onChange={(e) => setFiber(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sugar">Açúcares (g)</Label>
                                            <Input
                                                id="sugar"
                                                type="number"
                                                step="0.1"
                                                value={sugar}
                                                onChange={(e) => setSugar(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="saturatedFat">Gordura Saturada (g)</Label>
                                            <Input
                                                id="saturatedFat"
                                                type="number"
                                                step="0.1"
                                                value={saturatedFat}
                                                onChange={(e) => setSaturatedFat(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="transFat">Gordura Trans (g)</Label>
                                            <Input
                                                id="transFat"
                                                type="number"
                                                step="0.1"
                                                value={transFat}
                                                onChange={(e) => setTransFat(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="monounsaturatedFat">Gordura Monoinsaturada (g)</Label>
                                            <Input
                                                id="monounsaturatedFat"
                                                type="number"
                                                step="0.1"
                                                value={monounsaturatedFat}
                                                onChange={(e) => setMonounsaturatedFat(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="polyunsaturatedFat">Gordura Poliinsaturada (g)</Label>
                                            <Input
                                                id="polyunsaturatedFat"
                                                type="number"
                                                step="0.1"
                                                value={polyunsaturatedFat}
                                                onChange={(e) => setPolyunsaturatedFat(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cholesterol">Colesterol (mg)</Label>
                                            <Input
                                                id="cholesterol"
                                                type="number"
                                                step="0.1"
                                                value={cholesterol}
                                                onChange={(e) => setCholesterol(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sodium">Sódio (mg)</Label>
                                            <Input
                                                id="sodium"
                                                type="number"
                                                step="0.1"
                                                value={sodium}
                                                onChange={(e) => setSodium(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: Micronutrients */}
                <TabsContent value="micros" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Micronutrientes</CardTitle>
                            <CardDescription>
                                Vitaminas e minerais (opcional) - Todos os valores serão normalizados para 100g
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Minerals */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground">Minerais (mg por {inputMode === 'portion' ? `${labelPortionSize}g` : '100g'})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="calcium">Cálcio (mg)</Label>
                                        <Input
                                            id="calcium"
                                            type="number"
                                            step="0.1"
                                            value={calcium}
                                            onChange={(e) => setCalcium(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="iron">Ferro (mg)</Label>
                                        <Input
                                            id="iron"
                                            type="number"
                                            step="0.1"
                                            value={iron}
                                            onChange={(e) => setIron(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="magnesium">Magnésio (mg)</Label>
                                        <Input
                                            id="magnesium"
                                            type="number"
                                            step="0.1"
                                            value={magnesium}
                                            onChange={(e) => setMagnesium(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phosphorus">Fósforo (mg)</Label>
                                        <Input
                                            id="phosphorus"
                                            type="number"
                                            step="0.1"
                                            value={phosphorus}
                                            onChange={(e) => setPhosphorus(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="potassium">Potássio (mg)</Label>
                                        <Input
                                            id="potassium"
                                            type="number"
                                            step="0.1"
                                            value={potassium}
                                            onChange={(e) => setPotassium(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zinc">Zinco (mg)</Label>
                                        <Input
                                            id="zinc"
                                            type="number"
                                            step="0.1"
                                            value={zinc}
                                            onChange={(e) => setZinc(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vitamins */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground">Vitaminas (mg por {inputMode === 'portion' ? `${labelPortionSize}g` : '100g'})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vitaminA">Vitamina A (mg)</Label>
                                        <Input
                                            id="vitaminA"
                                            type="number"
                                            step="0.1"
                                            value={vitaminA}
                                            onChange={(e) => setVitaminA(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vitaminC">Vitamina C (mg)</Label>
                                        <Input
                                            id="vitaminC"
                                            type="number"
                                            step="0.1"
                                            value={vitaminC}
                                            onChange={(e) => setVitaminC(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vitaminD">Vitamina D (mg)</Label>
                                        <Input
                                            id="vitaminD"
                                            type="number"
                                            step="0.1"
                                            value={vitaminD}
                                            onChange={(e) => setVitaminD(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vitaminE">Vitamina E (mg)</Label>
                                        <Input
                                            id="vitaminE"
                                            type="number"
                                            step="0.1"
                                            value={vitaminE}
                                            onChange={(e) => setVitaminE(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vitaminB12">Vitamina B12 (mg)</Label>
                                        <Input
                                            id="vitaminB12"
                                            type="number"
                                            step="0.1"
                                            value={vitaminB12}
                                            onChange={(e) => setVitaminB12(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="folate">Folato (mg)</Label>
                                        <Input
                                            id="folate"
                                            type="number"
                                            step="0.1"
                                            value={folate}
                                            onChange={(e) => setFolate(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Button (only in full mode) */}
            {!isCompact && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button onClick={handleSubmit} disabled={loading} size="lg">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {initialData ? 'Atualizando...' : 'Criando...'}
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                {initialData ? 'Atualizar Alimento' : 'Criar Alimento'}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
});

export default SmartFoodForm;
