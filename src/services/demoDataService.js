import { supabase } from '@/lib/customSupabaseClient';

/**
 * Demo Data Service
 * 
 * Funções para gerar dados de demonstração no Supabase
 * para uso em apresentações e demos para investidores
 */

/**
 * Gera um UUID v4 aleatório
 * @returns {string} UUID
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Nomes brasileiros aleatórios para pacientes fantasma
const RANDOM_NAMES = [
  'Ana Silva', 'Carlos Souza', 'Maria Santos', 'João Oliveira', 'Fernanda Costa',
  'Pedro Almeida', 'Juliana Lima', 'Rafael Pereira', 'Camila Rodrigues', 'Lucas Ferreira',
  'Beatriz Gomes', 'Gabriel Martins', 'Isabela Ribeiro', 'Thiago Carvalho', 'Larissa Araújo'
];

// Gêneros aleatórios
const GENDERS = ['M', 'F', 'O'];

/**
 * Cria um paciente fantasma (ghost patient) vinculado ao nutricionista
 * @param {string} nutritionistId - UUID do nutricionista admin
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createGhostPatient(nutritionistId) {
  try {
    // Gerar UUID aleatório para o paciente
    const patientId = generateUUID();
    
    // Selecionar nome e dados aleatórios
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomGender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    
    // Gerar email fake único
    const randomSuffix = Math.floor(Math.random() * 10000);
    const fakeEmail = `paciente.${randomSuffix}@demo.hipozero.com.br`;
    
    // Gerar data de nascimento aleatória (entre 18 e 65 anos)
    const today = new Date();
    const age = 18 + Math.floor(Math.random() * 47); // 18-65 anos
    const birthDate = new Date(today.getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    // Dados do perfil do paciente
    const profileData = {
      id: patientId,
      name: randomName,
      email: fakeEmail,
      user_type: 'patient',
      nutritionist_id: nutritionistId,
      gender: randomGender,
      birth_date: birthDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      height: 150 + Math.floor(Math.random() * 50), // 150-200 cm
      weight: 50 + Math.floor(Math.random() * 50), // 50-100 kg
      goal: ['Perder peso', 'Ganhar massa', 'Manter peso', 'Melhorar saúde'][Math.floor(Math.random() * 4)],
      is_active: true,
      // Campos opcionais para evitar erros de constraint
      cpf: null, // Não preencher CPF para evitar conflitos
      phone: null,
      occupation: null,
      civil_status: null,
      observations: null,
      address: null,
    };

    // Inserir no user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('[demoDataService] Erro ao criar paciente fantasma:', error);
      return { data: null, error };
    }

    console.log('[demoDataService] Paciente fantasma criado:', data);
    return { data, error: null };
  } catch (error) {
    console.error('[demoDataService] Erro inesperado ao criar paciente fantasma:', error);
    return { data: null, error };
  }
}

/**
 * Preenche o diário do paciente com refeições aleatórias para hoje
 * @param {string} patientId - UUID do paciente
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fillDailyDiary(patientId) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Buscar 4-5 alimentos aleatórios do banco
    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('id, name, calories, protein, carbs, fat, base_qty')
      .limit(50); // Pegar um pool maior para ter mais variedade

    if (foodsError) {
      console.error('[demoDataService] Erro ao buscar alimentos:', foodsError);
      return { data: null, error: foodsError };
    }

    if (!foods || foods.length === 0) {
      return { 
        data: null, 
        error: { message: 'Nenhum alimento encontrado no banco de dados' } 
      };
    }

    // Selecionar 4-5 alimentos aleatórios
    const selectedFoods = [];
    const numFoods = 4 + Math.floor(Math.random() * 2); // 4 ou 5 alimentos
    const shuffled = [...foods].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numFoods && i < shuffled.length; i++) {
      selectedFoods.push(shuffled[i]);
    }

    // Tipos de refeição e horários
    const mealTypes = [
      { type: 'breakfast', time: '08:00:00', name: 'Café da Manhã' },
      { type: 'lunch', time: '12:30:00', name: 'Almoço' },
      { type: 'snack', time: '16:00:00', name: 'Lanche' },
      { type: 'dinner', time: '19:30:00', name: 'Jantar' }
    ];

    // Criar refeições para cada tipo
    const mealsCreated = [];
    const mealItemsCreated = [];

    for (const mealType of mealTypes) {
      // Selecionar 1-2 alimentos aleatórios para esta refeição
      const numItemsForMeal = 1 + Math.floor(Math.random() * 2); // 1 ou 2 alimentos
      const shuffledForMeal = [...selectedFoods].sort(() => 0.5 - Math.random());
      const foodsForMeal = shuffledForMeal.slice(0, numItemsForMeal);

      if (foodsForMeal.length === 0) continue;

      // Calcular totais nutricionais
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      const itemsForMeal = [];

      for (const food of foodsForMeal) {
        // Quantidade aleatória (entre 50g e 200g, ou 1-3 unidades se for medida caseira)
        const quantity = 50 + Math.floor(Math.random() * 150);
        
        // Calcular valores nutricionais baseado na quantidade
        const multiplier = quantity / (food.base_qty || 100); // base_qty geralmente é 100g
        
        const itemCalories = (food.calories || 0) * multiplier;
        const itemProtein = (food.protein || 0) * multiplier;
        const itemCarbs = (food.carbs || 0) * multiplier;
        const itemFat = (food.fat || 0) * multiplier;

        totalCalories += itemCalories;
        totalProtein += itemProtein;
        totalCarbs += itemCarbs;
        totalFat += itemFat;

        itemsForMeal.push({
          food_id: food.id,
          name: food.name,
          quantity: quantity,
          unit: 'gram',
          calories: Math.round(itemCalories * 100) / 100,
          protein: Math.round(itemProtein * 100) / 100,
          carbs: Math.round(itemCarbs * 100) / 100,
          fat: Math.round(itemFat * 100) / 100,
        });
      }

      // Criar a refeição
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          patient_id: patientId,
          meal_date: todayStr,
          meal_time: mealType.time,
          meal_type: mealType.type,
          notes: `Refeição de demonstração - ${mealType.name}`,
          total_calories: Math.round(totalCalories * 100) / 100,
          total_protein: Math.round(totalProtein * 100) / 100,
          total_carbs: Math.round(totalCarbs * 100) / 100,
          total_fat: Math.round(totalFat * 100) / 100,
        })
        .select()
        .single();

      if (mealError) {
        console.error(`[demoDataService] Erro ao criar refeição ${mealType.type}:`, mealError);
        continue; // Continuar com as outras refeições mesmo se uma falhar
      }

      mealsCreated.push(meal);

      // Adicionar itens da refeição
      const itemsToInsert = itemsForMeal.map(item => ({
        meal_id: meal.id,
        food_id: item.food_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error(`[demoDataService] Erro ao inserir itens da refeição ${mealType.type}:`, itemsError);
      } else {
        mealItemsCreated.push(...itemsToInsert);
      }
    }

    if (mealsCreated.length === 0) {
      return {
        data: null,
        error: { message: 'Não foi possível criar nenhuma refeição' }
      };
    }

    console.log('[demoDataService] Diário preenchido:', {
      meals: mealsCreated.length,
      items: mealItemsCreated.length
    });

    return {
      data: {
        meals: mealsCreated,
        items: mealItemsCreated,
        totalMeals: mealsCreated.length,
        totalItems: mealItemsCreated.length
      },
      error: null
    };
  } catch (error) {
    console.error('[demoDataService] Erro inesperado ao preencher diário:', error);
    return { data: null, error };
  }
}

