// src/pages/PatientAnamnesePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Settings, Edit2, Trash2, FileText, Save } from 'lucide-react';
import {
    getAnamneseFields,
    createAnamneseField,
    updateAnamneseField,
    deleteAnamneseField,
    getAnamneseAnswers,
    upsertAnamneseAnswers
} from '@/lib/supabase/anamnesis-queries';
import { exportAnamneseToPdf } from '@/lib/pdfUtils';
import { supabase } from '@/lib/customSupabaseClient';

const PatientAnamnesePage = () => {
    const { patientId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Estado geral
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(null);

    // Estado dos campos (perguntas)
    const [fields, setFields] = useState([]);

    // Estado das respostas
    const [answers, setAnswers] = useState({});

    // Modal de gerenciamento de perguntas
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState(null);

    // Formulário de nova pergunta
    const [newField, setNewField] = useState({
        fieldLabel: '',
        fieldType: 'texto_curto',
        optionsArray: ''
    });

    // Carregar dados iniciais
    const loadData = useCallback(async () => {
        if (!user?.id || !patientId) return;

        setLoading(true);
        try {
            // Buscar paciente
            const { data: patientData, error: patientError } = await supabase
                .from('user_profiles')
                .select('id, name, full_name')
                .eq('id', patientId)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);

            // Buscar campos do nutricionista
            const { data: fieldsData, error: fieldsError } = await getAnamneseFields(user.id);
            if (fieldsError) throw fieldsError;
            setFields(fieldsData || []);

            // Buscar respostas do paciente
            const { data: answersData, error: answersError } = await getAnamneseAnswers(patientId);
            if (answersError) throw answersError;

            // Transformar array de respostas em objeto { field_id: answer_value }
            const answersMap = {};
            (answersData || []).forEach(ans => {
                answersMap[ans.field_id] = ans.answer_value;
            });
            setAnswers(answersMap);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast({
                title: 'Erro ao carregar dados',
                description: error.message || 'Ocorreu um erro ao carregar os dados da anamnese.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id, patientId, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ========== CRUD DE CAMPOS ==========

    const handleCreateField = async () => {
        if (!newField.fieldLabel.trim()) {
            toast({
                title: 'Atenção',
                description: 'Digite o nome da pergunta.',
                variant: 'destructive',
            });
            return;
        }

        // Validar options_array se for seleção
        if ((newField.fieldType === 'selecao_unica' || newField.fieldType === 'selecao_multipla') && !newField.optionsArray.trim()) {
            toast({
                title: 'Atenção',
                description: 'Digite as opções separadas por vírgula.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Converter string de opções em array
            let optionsArray = null;
            if (newField.fieldType === 'selecao_unica' || newField.fieldType === 'selecao_multipla') {
                optionsArray = newField.optionsArray
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);
            }

            const { data, error } = await createAnamneseField({
                nutritionistId: user.id,
                fieldLabel: newField.fieldLabel,
                fieldType: newField.fieldType,
                optionsArray: optionsArray
            });

            if (error) throw error;

            setFields([...fields, data]);
            setNewField({ fieldLabel: '', fieldType: 'texto_curto', optionsArray: '' });

            toast({
                title: 'Sucesso!',
                description: 'Pergunta criada com sucesso.',
            });

        } catch (error) {
            console.error('Erro ao criar campo:', error);
            toast({
                title: 'Erro ao criar pergunta',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleUpdateField = async () => {
        if (!editingField?.field_label?.trim()) {
            toast({
                title: 'Atenção',
                description: 'Digite o nome da pergunta.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Converter string de opções em array
            let optionsArray = null;
            if (editingField.field_type === 'selecao_unica' || editingField.field_type === 'selecao_multipla') {
                optionsArray = (editingField.options_array_string || '')
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);
            }

            const { data, error } = await updateAnamneseField(editingField.id, {
                fieldLabel: editingField.field_label,
                fieldType: editingField.field_type,
                optionsArray: optionsArray
            });

            if (error) throw error;

            setFields(fields.map(f => f.id === data.id ? data : f));
            setEditingField(null);

            toast({
                title: 'Sucesso!',
                description: 'Pergunta atualizada com sucesso.',
            });

        } catch (error) {
            console.error('Erro ao atualizar campo:', error);
            toast({
                title: 'Erro ao atualizar pergunta',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleDeleteField = async () => {
        if (!fieldToDelete) return;

        try {
            const { error } = await deleteAnamneseField(fieldToDelete.id);
            if (error) throw error;

            setFields(fields.filter(f => f.id !== fieldToDelete.id));
            setDeleteDialogOpen(false);
            setFieldToDelete(null);

            toast({
                title: 'Sucesso!',
                description: 'Pergunta excluída com sucesso.',
            });

        } catch (error) {
            console.error('Erro ao deletar campo:', error);
            toast({
                title: 'Erro ao excluir pergunta',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const openEditDialog = (field) => {
        setEditingField({
            ...field,
            options_array_string: Array.isArray(field.options_array)
                ? field.options_array.join(', ')
                : ''
        });
    };

    const openDeleteDialog = (field) => {
        setFieldToDelete(field);
        setDeleteDialogOpen(true);
    };

    // ========== FORMULÁRIO DINÂMICO ==========

    const handleAnswerChange = (fieldId, value) => {
        setAnswers(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const renderField = (field) => {
        const value = answers[field.id] || '';

        switch (field.field_type) {
            case 'texto_curto':
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder="Digite sua resposta..."
                        className="w-full"
                    />
                );

            case 'texto_longo':
                return (
                    <Textarea
                        value={value}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder="Digite sua resposta..."
                        rows={4}
                        className="w-full"
                    />
                );

            case 'selecao_unica':
                return (
                    <RadioGroup
                        value={value}
                        onValueChange={(val) => handleAnswerChange(field.id, val)}
                    >
                        {(field.options_array || []).map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                                <Label htmlFor={`${field.id}-${idx}`} className="cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'selecao_multipla':
                const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

                return (
                    <div className="space-y-2">
                        {(field.options_array || []).map((option, idx) => {
                            const isChecked = selectedValues.includes(option);

                            return (
                                <div key={idx} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${field.id}-${idx}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let newValues;
                                            if (checked) {
                                                newValues = [...selectedValues, option];
                                            } else {
                                                newValues = selectedValues.filter(v => v !== option);
                                            }
                                            handleAnswerChange(field.id, newValues);
                                        }}
                                    />
                                    <Label htmlFor={`${field.id}-${idx}`} className="cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                );

            default:
                return <p className="text-muted-foreground">Tipo de campo desconhecido</p>;
        }
    };

    // ========== SALVAR RESPOSTAS ==========

    const handleSaveAnswers = async () => {
        setSaving(true);
        try {
            // Preparar dados para upsert
            const answersData = fields.map(field => ({
                patient_id: patientId,
                field_id: field.id,
                answer_value: answers[field.id] || null
            }));

            const { error } = await upsertAnamneseAnswers(answersData);
            if (error) throw error;

            toast({
                title: 'Sucesso!',
                description: 'Respostas salvas com sucesso.',
            });

        } catch (error) {
            console.error('Erro ao salvar respostas:', error);
            toast({
                title: 'Erro ao salvar respostas',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    // ========== EXPORTAR PDF ==========

    const handleExportPdf = () => {
        // Preparar dados para exportação
        const anamneseData = fields.map(field => {
            const answer = answers[field.id];
            let resposta = '';

            if (answer) {
                if (Array.isArray(answer)) {
                    resposta = answer.join(', ');
                } else {
                    resposta = String(answer);
                }
            }

            return {
                pergunta: field.field_label,
                resposta: resposta || '(não respondido)'
            };
        });

        const patientName = patient?.full_name || patient?.name || 'Paciente';
        const nutritionistName = user?.profile?.full_name || user?.profile?.name || 'Nutricionista';

        exportAnamneseToPdf(anamneseData, patientName, nutritionistName);

        toast({
            title: 'PDF Exportado!',
            description: 'O arquivo foi baixado com sucesso.',
        });
    };

    // ========== RENDER ==========

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link to={`/nutritionist/patients/${patientId}/hub`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para o Hub do Paciente
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto w-full p-4 md:p-8">
                <Card className="bg-card shadow-card-dark rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-clash text-2xl font-semibold text-primary">
                                Anamnese - {patient?.full_name || patient?.name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Perguntas customizadas e histórico do paciente.
                            </CardDescription>
                        </div>
                        <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Gerenciar Perguntas
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Gerenciar Perguntas da Anamnese</DialogTitle>
                                    <DialogDescription>
                                        Crie, edite ou exclua suas perguntas personalizadas.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Formulário de Nova Pergunta */}
                                <div className="space-y-4 border-b pb-4">
                                    <h3 className="font-semibold text-lg">Nova Pergunta</h3>

                                    <div>
                                        <Label htmlFor="new-field-label">Nome da Pergunta</Label>
                                        <Input
                                            id="new-field-label"
                                            value={newField.fieldLabel}
                                            onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
                                            placeholder="Ex: Histórico de Doenças Familiares"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="new-field-type">Tipo de Campo</Label>
                                        <Select
                                            value={newField.fieldType}
                                            onValueChange={(val) => setNewField({ ...newField, fieldType: val })}
                                        >
                                            <SelectTrigger id="new-field-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="texto_curto">Texto Curto</SelectItem>
                                                <SelectItem value="texto_longo">Texto Longo</SelectItem>
                                                <SelectItem value="selecao_unica">Seleção Única</SelectItem>
                                                <SelectItem value="selecao_multipla">Seleção Múltipla</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(newField.fieldType === 'selecao_unica' || newField.fieldType === 'selecao_multipla') && (
                                        <div>
                                            <Label htmlFor="new-field-options">Opções (separadas por vírgula)</Label>
                                            <Textarea
                                                id="new-field-options"
                                                value={newField.optionsArray}
                                                onChange={(e) => setNewField({ ...newField, optionsArray: e.target.value })}
                                                placeholder="Ex: Sim, Não, Não sei"
                                                rows={2}
                                            />
                                        </div>
                                    )}

                                    <Button onClick={handleCreateField} className="w-full">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Criar Pergunta
                                    </Button>
                                </div>

                                {/* Lista de Perguntas Existentes */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Perguntas Existentes</h3>

                                    {fields.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">
                                            Você ainda não criou nenhuma pergunta.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {fields.map(field => (
                                                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{field.field_label}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Tipo: {field.field_type.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(field)}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openDeleteDialog(field)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>

                    <CardContent>
                        {fields.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">
                                    Você ainda não criou nenhuma pergunta de anamnese.
                                </p>
                                <Button onClick={() => setManageDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Primeira Pergunta
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Formulário Dinâmico */}
                                {fields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="text-base font-medium">
                                            {field.field_label}
                                        </Label>
                                        {renderField(field)}
                                    </div>
                                ))}

                                {/* Botões de Ação */}
                                <div className="flex gap-3 pt-6">
                                    <Button
                                        onClick={handleSaveAnswers}
                                        disabled={saving}
                                        className="flex-1"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Salvando...' : 'Salvar Respostas'}
                                    </Button>
                                    <Button
                                        onClick={handleExportPdf}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Exportar PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Dialog de Edição */}
            {editingField && (
                <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Pergunta</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-field-label">Nome da Pergunta</Label>
                                <Input
                                    id="edit-field-label"
                                    value={editingField.field_label}
                                    onChange={(e) => setEditingField({ ...editingField, field_label: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-field-type">Tipo de Campo</Label>
                                <Select
                                    value={editingField.field_type}
                                    onValueChange={(val) => setEditingField({ ...editingField, field_type: val })}
                                >
                                    <SelectTrigger id="edit-field-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="texto_curto">Texto Curto</SelectItem>
                                        <SelectItem value="texto_longo">Texto Longo</SelectItem>
                                        <SelectItem value="selecao_unica">Seleção Única</SelectItem>
                                        <SelectItem value="selecao_multipla">Seleção Múltipla</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(editingField.field_type === 'selecao_unica' || editingField.field_type === 'selecao_multipla') && (
                                <div>
                                    <Label htmlFor="edit-field-options">Opções (separadas por vírgula)</Label>
                                    <Textarea
                                        id="edit-field-options"
                                        value={editingField.options_array_string || ''}
                                        onChange={(e) => setEditingField({ ...editingField, options_array_string: e.target.value })}
                                        placeholder="Ex: Sim, Não, Não sei"
                                        rows={2}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingField(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleUpdateField}>
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a pergunta "{fieldToDelete?.field_label}"?
                            Esta ação não pode ser desfeita e todas as respostas associadas serão perdidas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFieldToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteField} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PatientAnamnesePage;
