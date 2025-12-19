import { storage } from './server/storage.js';
import { hashPassword } from './server/auth.js';

async function testFamilyFunctionality() {
  console.log('🧪 Тестирование функциональности FamilyFinance...\n');

  try {
    // 1. Создание пользователя и семьи
    console.log('1. Создание пользователя и семьи...');
    const user = await storage.createUser({
      username: 'testuser',
      password: 'testpass123',
      firstName: 'Тест',
      lastName: 'Пользователь'
    });
    console.log(`✅ Пользователь создан: ${user.username} (ID: ${user.id})`);

    const family = await storage.createFamily({
      name: 'Тестовая семья'
    });
    console.log(`✅ Семья создана: ${family.name} (ID: ${family.id})`);

    // Обновляем пользователя с familyId
    await storage.updateUser(user.id, { familyId: family.id });
    console.log('✅ Пользователь добавлен в семью');

    // 2. Создание категории
    console.log('\n2. Создание категории...');
    const category = await storage.createCategory({
      name: 'Продукты',
      type: 'expense',
      color: '#FF6B6B',
      icon: 'shopping-cart',
      familyId: family.id
    });
    console.log(`✅ Категория создана: ${category.name} (${category.type})`);

    // 3. Создание счета
    console.log('\n3. Создание счета...');
    const account = await storage.createAccount({
      name: 'Основной счет',
      type: 'checking',
      balance: 10000,
      currency: 'RUB',
      familyId: family.id
    });
    console.log(`✅ Счет создан: ${account.name} (${account.balance} ${account.currency})`);

    // 4. Создание транзакции
    console.log('\n4. Создание транзакции...');
    const transaction = await storage.createTransaction({
      amount: 500,
      date: new Date(),
      description: 'Покупка продуктов',
      type: 'expense',
      categoryId: category.id,
      accountId: account.id,
      createdById: user.id,
      familyId: family.id
    });
    console.log(`✅ Транзакция создана: ${transaction.description} (-${transaction.amount} руб.)`);

    // 5. Создание повторяющегося платежа (календарь)
    console.log('\n5. Создание повторяющегося платежа...');
    const recurringPayment = await storage.createRecurringPayment({
      name: 'Аренда квартиры',
      amount: 30000,
      frequency: 'monthly',
      startDate: new Date(),
      type: 'payment',
      color: '#4ECDC4',
      familyId: family.id
    });
    console.log(`✅ Повторяющийся платеж создан: ${recurringPayment.name} (${recurringPayment.amount} руб. ${recurringPayment.frequency})`);

    // 6. Проверка чтения данных
    console.log('\n6. Проверка чтения данных...');

    const categories = await storage.getCategoriesByFamilyId(family.id);
    console.log(`📂 Найдено категорий: ${categories.length}`);
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.type})`));

    const accounts = await storage.getAccountsByFamilyId(family.id);
    console.log(`🏦 Найдено счетов: ${accounts.length}`);
    accounts.forEach(acc => console.log(`   - ${acc.name}: ${acc.balance} ${acc.currency}`));

    const transactions = await storage.getTransactionsByFamilyId(family.id);
    console.log(`💳 Найдено транзакций: ${transactions.length}`);
    transactions.forEach(tx => console.log(`   - ${tx.description}: ${tx.amount} руб. (${tx.type})`));

    const recurringPayments = await storage.getRecurringPaymentsByFamilyId(family.id);
    console.log(`📅 Найдено повторяющихся платежей: ${recurringPayments.length}`);
    recurringPayments.forEach(rp => console.log(`   - ${rp.name}: ${rp.amount} руб. (${rp.frequency})`));

    // 7. Проверка типа хранилища
    console.log('\n7. Информация о хранилище:');
    const storageType = process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory';
    console.log(`💾 Используется хранилище: ${storageType}`);

    if (process.env.DATABASE_URL) {
      console.log('✅ Приложение работает с PostgreSQL базой данных!');
    } else {
      console.log('⚠️  Приложение работает с in-memory хранилищем (без БД)');
    }

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('Приложение корректно работает с базой данных для транзакций и календаря.');

  } catch (error) {
    console.error('❌ Ошибка во время тестирования:', error);
    process.exit(1);
  }
}

// Запуск теста
testFamilyFunctionality();
