// src/pages/PatientAnamnesePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    ClipboardList, Plus, Calendar, FileText, ChevronRight, Loader2, AlertCircle,
    Trash2, MoreVertical, Settings, Edit2, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    getPatientAnamnesisList,
    getAnamnesisTemplates,
    deleteAnamnesis,
    getCustomTemplates,
    createCustomFormTemplate
} from '@/lib/supabase/anamnesis-queries';
import { supabase } from '@/lib/customSupabaseClient';

const PatientAnamnesePage = () => {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();

    // Estados
    const [patient, setPatient] = useState(null);
    const [anamnesisList, setAnamnesisList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Templates
    const [standardTemplates, setStandardTemplates] = useState([]);
    const [customTemplates, setCustomTemplates] = useState([]);

    // Modals
    const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
    const [showTemplateSelectionModal, setShowTemplateSelectionModal] = useState(false);
    const [selectedTemplateType, setSelectedTemplateType] = useState(null); // 'standard' ou 'custom'
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Modal de criação de formulário personalizado
    const [showCreateCustomModal, setShowCreateCustomModal] = useState(false);
    const [newCustomTemplate, setNewCustomTemplate] = useState({
        title: '',
        description: ''
    });
    const [creating, setCreating] = useState(false);

    // Modal de confirmação de exclusão
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [anamnesisToDelete, setAnamnesisToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Carregar dados iniciais
    const loadData = useCallback(async () => {
        if (!patientId || !user?.id) return;

        setLoading(true);
        setError(null);

        try {
            // Buscar paciente
            const { data: patientData, error: patientError } = await supabase
                .from('user_profiles')
                .select('id, name, full_name')
                .eq('id', patientId)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);

            // Buscar lista de anamneses
            const { data: anamnesisData, error: anamnesisError } = await getPatientAnamnesisList(patientId);
            if (anamnesisError) throw anamnesisError;
            setAnamnesisList(anamnesisData || []);

            // Buscar templates padrão
            const { data: templatesData, error: templatesError } = await getAnamnesisTemplates(user.id);
            if (templatesError) throw templatesError;
            const standard = (templatesData || []).filter(t => !t.is_custom_fields);
            setStandardTemplates(standard);

            // Buscar templates personalizados
            const { data: customData, error: customError } = await getCustomTemplates(user.id);
            if (customError) throw customError;
            setCustomTemplates(customData || []);

        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [patientId, user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handler para criar nova anamnese
    const handleCreateNew = () => {
        setShowTypeSelectionModal(true);
    };

    // Handler para selecionar tipo (padrão ou personalizado)
    const handleSelectType = (type) => {
        setSelectedTemplateType(type);
        setShowTypeSelectionModal(false);

        if (type === 'standard') {
            if (standardTemplates.length === 0) {
                toast({
                    title: 'Atenção',
                    description: 'Nenhum template padrão disponível.',
                    variant: 'destructive',
                });
                return;
            }

            if (standardTemplates.length === 1) {
                // Ir direto se só houver um template
                navigate(`/nutritionist/patients/${patientId}/anamnesis/new?templateId=${standardTemplates[0].id}`);
                return;
            }

            // Mostrar modal de seleção de template padrão
            setShowTemplateSelectionModal(true);

        } else if (type === 'custom') {
            if (customTemplates.length === 0) {
                // Se não houver templates personalizados, abrir modal de criação
                setShowCreateCustomModal(true);
                return;
            }

            // Mostrar modal de seleção de template personalizado
            setShowTemplateSelectionModal(true);

        } else if (type === 'create_new') {
            setShowCreateCustomModal(true);
        }
    };

    // Handler para selecionar template e navegar
    const handleTemplateSelect = () => {
        if (!selectedTemplate) return;

        setShowTemplateSelectionModal(false);

        if (selectedTemplateType === 'standard') {
            navigate(`/nutritionist/patients/${patientId}/anamnesis/new?templateId=${selectedTemplate}`);
        } else if (selectedTemplateType === 'custom') {
            navigate(`/nutritionist/patients/${patientId}/anamnesis/new?customTemplateId=${selectedTemplate}`);
        }
    };

    // Handler para criar formulário personalizado
    const handleCreateCustomTemplate = async () => {
        if (!newCustomTemplate.title.trim()) {
            toast({
                title: 'Atenção',
                description: 'Digite um nome para o formulário personalizado.',
                variant: 'destructive',
            });
            return;
        }

        setCreating(true);
        try {
            const { data, error } = await createCustomFormTemplate({
                nutritionistId: user.id,
                title: newCustomTemplate.title,
                description: newCustomTemplate.description
            });

            if (error) throw error;

            toast({
                title: 'Sucesso!',
                description: 'Formulário personalizado criado. Agora adicione suas perguntas.',
            });

            setShowCreateCustomModal(false);
            setNewCustomTemplate({ title: '', description: '' });

            // Navegar para a página de edição do formulário personalizado
            navigate(`/nutritionist/patients/${patientId}/anamnesis/new?customTemplateId=${data.id}&edit=true`);

        } catch (err) {
            console.error('Erro ao criar formulário personalizado:', err);
            toast({
                title: 'Erro ao criar formulário',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    // Handler para editar anamnese existente
    const handleEditAnamnesis = (anamnesisId) => {
        navigate(`/nutritionist/patients/${patientId}/anamnesis/${anamnesisId}/edit`);
    };

    // Handler para abrir modal de confirmação de exclusão
    const handleDeleteClick = (anamnesis, e) => {
        e.stopPropagation();
        setAnamnesisToDelete(anamnesis);
        setShowDeleteDialog(true);
    };

    // Handler para confirmar exclusão
    const handleConfirmDelete = async () => {
        if (!anamnesisToDelete) return;

        setDeleting(true);
        try {
            const { error } = await deleteAnamnesis(anamnesisToDelete.id);
            if (error) throw error;

            setAnamnesisList(prev => prev.filter(a => a.id !== anamnesisToDelete.id));
            setShowDeleteDialog(false);
            setAnamnesisToDelete(null);

            toast({
                title: 'Sucesso!',
                description: 'Anamnese excluída com sucesso.',
            });

        } catch (err) {
            console.error('Erro ao excluir anamnese:', err);
            toast({
                title: 'Erro ao excluir anamnese',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
        }
    };

    // ============================================================
    // COMPONENTES DE UI
    // ============================================================

    // Estado Vazio
    const EmptyState = () => (
        <Card className="border-dashed border-2 border-[#a9b388] bg-[#fefae0]/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#fefae0] flex items-center justify-center mb-6">
                    <ClipboardList className="w-10 h-10 text-[#5f6f52]" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                    Nenhuma Anamnese Preenchida
                </h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-md">
                    Inicie a primeira anamnese usando um formulário padrão ou crie seu próprio formulário personalizado.
                </p>
                <Button
                    onClick={handleCreateNew}
                    size="lg"
                    className="gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Iniciar Anamnese
                </Button>
            </CardContent>
        </Card>
    );

    // Card de Anamnese
    const AnamnesisCard = ({ anamnesis }) => {
        const statusConfig = {
            draft: {
                label: 'Rascunho',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
            },
            completed: {
                label: 'Completa',
                color: 'bg-green-100 text-green-800 border-green-300'
            }
        };

        const config = statusConfig[anamnesis.status] || statusConfig.draft;

        return (
            <Card className="hover:shadow-md transition-all hover:border-[#5f6f52]">
                <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-6 group">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-[#5f6f52]/10 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-[#5f6f52]" />
                            </div>
                        </div>

                        <button
                            onClick={() => handleEditAnamnesis(anamnesis.id)}
                            className="flex-1 min-w-0 text-left hover:bg-[#fefae0]/30 -mx-4 -my-6 px-4 py-6 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-base text-foreground">
                                        {anamnesis.template?.title || 'Anamnese'}
                                    </h4>
                                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                                        {config.label}
                                    </Badge>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(anamnesis.date).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>
                                {anamnesis.updated_at && (
                                    <p className="text-xs text-muted-foreground">
                                        Última modificação: {new Date(anamnesis.updated_at).toLocaleDateString('pt-BR')} às{' '}
                                        {new Date(anamnesis.updated_at).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>

                            {anamnesis.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {anamnesis.notes}
                                </p>
                            )}
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => handleDeleteClick(anamnesis, e)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ============================================================
    // MODALS
    // ============================================================

    // Modal de Seleção de Tipo
    const TypeSelectionModal = () => (
        <Dialog open={showTypeSelectionModal} onOpenChange={setShowTypeSelectionModal}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Como deseja preencher a anamnese?</DialogTitle>
                    <DialogDescription>
                        Escolha entre um formulário padrão ou crie seu próprio formulário personalizado
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Opção 1: Formulário Padrão */}
                    <button
                        onClick={() => handleSelectType('standard')}
                        className="p-6 rounded-lg border-2 border-gray-200 hover:border-[#5f6f52] hover:bg-[#fefae0]/30 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-[#5f6f52]/10 flex items-center justify-center mb-4 group-hover:bg-[#5f6f52]/20 transition-colors">
                            <FileText className="w-6 h-6 text-[#5f6f52]" />
                        </div>
                        <h3 className="font-semibold text-base mb-2">Formulário Padrão</h3>
                        <p className="text-sm text-muted-foreground">
                            Use o template completo de anamnese nutricional com perguntas pré-definidas.
                        </p>
                    </button>

                    {/* Opção 2: Formulários Personalizados */}
                    <button
                        onClick={() => handleSelectType('custom')}
                        className="p-6 rounded-lg border-2 border-gray-200 hover:border-[#5f6f52] hover:bg-[#fefae0]/30 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-[#a9b388]/10 flex items-center justify-center mb-4 group-hover:bg-[#a9b388]/20 transition-colors">
                            <Settings className="w-6 h-6 text-[#5f6f52]" />
                        </div>
                        <h3 className="font-semibold text-base mb-2">
                            Formulários Personalizados
                            {customTemplates.length > 0 && (
                                <Badge className="ml-2 bg-[#5f6f52]">{customTemplates.length}</Badge>
                            )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {customTemplates.length > 0
                                ? 'Escolha um dos seus formulários personalizados ou crie um novo.'
                                : 'Crie seu primeiro formulário personalizado com perguntas sob medida.'}
                        </p>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );

    // Modal de Seleção de Template
    const TemplateSelectionModal = () => {
        const templates = selectedTemplateType === 'standard' ? standardTemplates : customTemplates;

        return (
            <Dialog open={showTemplateSelectionModal} onOpenChange={setShowTemplateSelectionModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTemplateType === 'standard' ? 'Escolher Formulário Padrão' : 'Escolher Formulário Personalizado'}
                        </DialogTitle>
                        <DialogDescription>
                            Selecione o formulário que deseja utilizar
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                                    selectedTemplate === template.id
                                        ? "border-[#5f6f52] bg-[#5f6f52]/5"
                                        : "border-gray-200 hover:border-[#5f6f52]/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                        selectedTemplate === template.id
                                            ? "border-[#5f6f52] bg-[#5f6f52]"
                                            : "border-gray-300"
                                    )}>
                                        {selectedTemplate === template.id && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm">{template.title}</h4>
                                            {template.is_system_default && (
                                                <Badge variant="outline" className="text-xs bg-[#5f6f52]/10 text-[#5f6f52] border-[#5f6f52]">
                                                    Padrão
                                                </Badge>
                                            )}
                                        </div>
                                        {template.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Opção de criar novo formulário personalizado */}
                        {selectedTemplateType === 'custom' && (
                            <button
                                onClick={() => {
                                    setShowTemplateSelectionModal(false);
                                    setShowCreateCustomModal(true);
                                }}
                                className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#5f6f52] hover:bg-[#fefae0]/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#fefae0] flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-[#5f6f52]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Criar Novo Formulário</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Monte um formulário personalizado do zero
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowTemplateSelectionModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleTemplateSelect}
                            disabled={!selectedTemplate}
                        >
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // Modal de Criação de Formulário Personalizado
    const CreateCustomModal = () => (
        <Dialog open={showCreateCustomModal} onOpenChange={setShowCreateCustomModal}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Criar Formulário Personalizado</DialogTitle>
                    <DialogDescription>
                        Dê um nome ao seu formulário. Você poderá adicionar perguntas na próxima etapa.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="custom-title">Nome do Formulário *</Label>
                        <Input
                            id="custom-title"
                            value={newCustomTemplate.title}
                            onChange={(e) => setNewCustomTemplate({ ...newCustomTemplate, title: e.target.value })}
                            placeholder="Ex: Anamnese para Emagrecimento"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <Label htmlFor="custom-description">Descrição (opcional)</Label>
                        <Textarea
                            id="custom-description"
                            value={newCustomTemplate.description}
                            onChange={(e) => setNewCustomTemplate({ ...newCustomTemplate, description: e.target.value })}
                            placeholder="Descreva o objetivo deste formulário..."
                            rows={3}
                            maxLength={500}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowCreateCustomModal(false);
                            setNewCustomTemplate({ title: '', description: '' });
                        }}
                        disabled={creating}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateCustomTemplate}
                        disabled={creating || !newCustomTemplate.title.trim()}
                    >
                        {creating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Criar e Adicionar Perguntas'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Modal de Confirmação de Exclusão
    const DeleteDialog = () => (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir esta anamnese? Esta ação não pode ser desfeita.
                        {anamnesisToDelete && (
                            <div className="mt-3 p-3 bg-[#fefae0] rounded-lg border border-[#a9b388]">
                                <p className="text-sm font-medium text-foreground">
                                    {anamnesisToDelete.template?.title || 'Anamnese'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Data: {new Date(anamnesisToDelete.date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            'Excluir'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5f6f52] mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/nutritionist/patients/${patientId}/hub`)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar ao Prontuário
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <ClipboardList className="w-8 h-8 text-[#5f6f52]" />
                            Anamnese
                        </h1>
                        {patient && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Paciente: <span className="font-medium text-foreground">{patient.full_name || patient.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Botão Nova Anamnese (só aparece se já houver anamneses) */}
                    {anamnesisList.length > 0 && (
                        <Button
                            onClick={handleCreateNew}
                            size="lg"
                            className="gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Nova Anamnese
                        </Button>
                    )}
                </div>

                {/* Erro */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Lista de Anamneses */}
                {anamnesisList.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4">
                        {anamnesisList.map((anamnesis) => (
                            <AnamnesisCard key={anamnesis.id} anamnesis={anamnesis} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <TypeSelectionModal />
            <TemplateSelectionModal />
            <CreateCustomModal />
            <DeleteDialog />
        </div>
    );
};

export default PatientAnamnesePage;
