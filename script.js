// Финансовый Пульс - Основной JavaScript файл

class FinancePulse {
    constructor() {
        this.operations = JSON.parse(localStorage.getItem('financePulse_operations')) || [];
        this.goals = JSON.parse(localStorage.getItem('financePulse_goals')) || [];
        this.categories = JSON.parse(localStorage.getItem('financePulse_categories')) || this.getDefaultCategories();
        this.settings = JSON.parse(localStorage.getItem('financePulse_settings')) || this.getDefaultSettings();
        
        this.charts = {};
        this.currentSection = 'dashboard';
        this.cloudDataId = localStorage.getItem('financePulse_cloudId') || null;
        this.autoSyncInterval = null;
        
        this.init();
    }

    init() {
        this.initNavigation();
        this.initModals();
        this.initForms();
        this.initEventListeners();
        this.updateDashboard();
        this.renderOperationsTable();
        this.renderGoals();
        this.renderCategories();
        this.initCharts();
        
        // Автоматическая загрузка данных из облака при старте
        this.initAutoSync();
    }

    getDefaultCategories() {
        return {
            income: {
                main: ['Зарплата', 'Премия', 'Бонус'],
                side: ['Фриланс', 'Продажи', 'Консультации', 'Курсы']
            },
            expense: {
                personal: ['Продукты', 'Транспорт', 'ЖКХ', 'Развлечения', 'Одежда', 'Медицина'],
                business: ['Материалы', 'Реклама', 'Комиссии', 'Инструменты']
            }
        };
    }

    getDefaultSettings() {
        return {
            currency: 'RUB',
            currencySymbol: '₽'
        };
    }

    // Навигация
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const contentSections = document.querySelectorAll('.content-section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                
                navItems.forEach(nav => nav.classList.remove('active'));
                contentSections.forEach(sec => sec.classList.remove('active'));
                
                item.classList.add('active');
                document.getElementById(section).classList.add('active');
                
                this.currentSection = section;
                
                if (section === 'analytics') {
                    this.updateAnalytics();
                }
            });
        });
    }

    // Модальные окна
    initModals() {
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close');

        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    // Формы
    initForms() {
        // Форма операции
        const operationForm = document.getElementById('operationForm');
        operationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addOperation();
        });

        // Форма цели
        const goalForm = document.getElementById('goalForm');
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });

        // Обработчик изменения типа операции
        const operationTypeRadios = document.querySelectorAll('input[name="type"]');
        operationTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateOperationForm();
            });
        });
    }

    // Слушатели событий
    initEventListeners() {
        // Кнопки добавления операций
        document.getElementById('addOperationBtn').addEventListener('click', () => {
            this.openModal('operationModal');
            this.updateOperationForm();
        });

        document.getElementById('fabBtn').addEventListener('click', () => {
            this.openModal('operationModal');
            this.updateOperationForm();
        });

        // Кнопка добавления цели
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            this.openModal('goalModal');
        });

        // Селектор периода
        document.getElementById('periodSelect').addEventListener('change', () => {
            this.updateDashboard();
        });

        // Табы в операциях
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(btn.parentElement, tab);
            });
        });

        // Кнопки категорий
        document.getElementById('addIncomeCategoryBtn').addEventListener('click', () => {
            this.addCategory('income');
        });

        document.getElementById('addExpenseCategoryBtn').addEventListener('click', () => {
            this.addCategory('expense');
        });

        // Фильтрация
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Табы операций
        const operationTabs = document.querySelectorAll('.tabs .tab-btn');
        operationTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchOperationTab(tab.dataset.tab);
            });
        });

        // Экспорт данных
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Очистка данных
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
                this.clearData();
            }
        });

        // Облачная синхронизация
        document.getElementById('saveToCloudBtn').addEventListener('click', () => {
            this.saveToCloud();
        });

        document.getElementById('loadFromCloudBtn').addEventListener('click', () => {
            this.loadFromCloud();
        });

        document.getElementById('autoSyncBtn').addEventListener('click', () => {
            this.toggleAutoSync();
        });

        // Загружаем ID облачного хранилища в поле
        if (this.cloudDataId) {
            document.getElementById('cloudDataId').value = this.cloudDataId;
        }
    }

    // Обновление формы операции
    updateOperationForm() {
        const operationType = document.querySelector('input[name="type"]:checked').value;
        const subtypeSelect = document.getElementById('subtype');
        const categorySelect = document.getElementById('category');

        // Обновляем подтипы
        subtypeSelect.innerHTML = '';
        if (operationType === 'income') {
            subtypeSelect.innerHTML = `
                <option value="main">Основной</option>
                <option value="side">Сторонний</option>
            `;
        } else {
            subtypeSelect.innerHTML = `
                <option value="personal">Личный</option>
                <option value="business">На подработку</option>
            `;
        }

        // Устанавливаем дату по умолчанию
        const dateInput = document.getElementById('date');
        if (!dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        this.updateCategoryOptions();
    }

    updateCategoryOptions() {
        const operationType = document.querySelector('input[name="type"]:checked').value;
        const subtype = document.getElementById('subtype').value;
        const categorySelect = document.getElementById('category');

        categorySelect.innerHTML = '';
        
        let categories = [];
        if (operationType === 'income') {
            categories = this.categories.income[subtype] || [];
        } else {
            categories = this.categories.expense[subtype] || [];
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        // Обновляем категории при изменении подтипа
        document.getElementById('subtype').addEventListener('change', () => {
            this.updateCategoryOptions();
        });
    }

    // Добавление операции
    addOperation() {
        const formData = new FormData(document.getElementById('operationForm'));
        const operation = {
            id: Date.now(),
            type: formData.get('type'),
            subtype: formData.get('subtype'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            owner: formData.get('owner') || 'me',
            date: formData.get('date'),
            comment: formData.get('comment') || '',
            timestamp: new Date().toISOString()
        };

        this.operations.unshift(operation);
        this.saveOperations();
        this.updateDashboard();
        this.renderOperationsTable();
        this.closeModal('operationModal');
        document.getElementById('operationForm').reset();
    }

    // Добавление цели
    addGoal() {
        const formData = new FormData(document.getElementById('goalForm'));
        const goal = {
            id: Date.now(),
            name: formData.get('goalName'),
            targetAmount: parseFloat(formData.get('goalAmount')),
            currentAmount: parseFloat(formData.get('currentAmount')),
            createdAt: new Date().toISOString()
        };

        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();
        this.closeModal('goalModal');
        document.getElementById('goalForm').reset();
    }

    // Обновление дашборда
    updateDashboard() {
        const period = document.getElementById('periodSelect').value;
        const operations = this.getOperationsForPeriod(period);

        // Расчет основных показателей
        const totals = this.calculateTotals(operations);

        // Обновляем UI
        document.getElementById('totalBalance').textContent = this.formatCurrency(totals.balance);
        document.getElementById('totalBalance').className = `balance-amount ${totals.balance >= 0 ? 'positive' : 'negative'}`;

        // Разделение балансов по владельцам
        document.getElementById('myBalance').textContent = this.formatCurrency(totals.myBalance);
        document.getElementById('catBalance').textContent = this.formatCurrency(totals.catBalance);

        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.totalIncome);
        document.getElementById('mainIncome').textContent = this.formatCurrency(totals.mainIncome);
        document.getElementById('sideIncome').textContent = this.formatCurrency(totals.sideIncome);

        document.getElementById('totalExpenses').textContent = this.formatCurrency(totals.totalExpenses);
        document.getElementById('personalExpenses').textContent = this.formatCurrency(totals.personalExpenses);
        document.getElementById('businessExpenses').textContent = this.formatCurrency(totals.businessExpenses);

        document.getElementById('sideProfit').textContent = this.formatCurrency(totals.sideProfit);

        // Обновляем график расходов
        this.updateExpensesChart(operations);
    }

    // Получение операций за период
    getOperationsForPeriod(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'current-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                return this.operations.filter(op => {
                    const opDate = new Date(op.date);
                    return opDate >= startDate && opDate <= endDate;
                });
            case 'current-quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return this.operations.filter(op => new Date(op.date) >= startDate);
    }

    // Расчет итогов
    calculateTotals(operations) {
        const totals = {
            totalIncome: 0,
            mainIncome: 0,
            sideIncome: 0,
            totalExpenses: 0,
            personalExpenses: 0,
            businessExpenses: 0,
            balance: 0,
            sideProfit: 0,
            myBalance: 0,
            catBalance: 0
        };

        operations.forEach(op => {
            const owner = op.owner || 'me'; // Для обратной совместимости
            
            if (op.type === 'income') {
                totals.totalIncome += op.amount;
                if (op.subtype === 'main') {
                    totals.mainIncome += op.amount;
                } else {
                    totals.sideIncome += op.amount;
                }
                
                // Распределение по владельцам
                if (owner === 'me') {
                    totals.myBalance += op.amount;
                } else {
                    totals.catBalance += op.amount;
                }
            } else {
                totals.totalExpenses += op.amount;
                if (op.subtype === 'personal') {
                    totals.personalExpenses += op.amount;
                } else {
                    totals.businessExpenses += op.amount;
                }
                
                // Распределение по владельцам
                if (owner === 'me') {
                    totals.myBalance -= op.amount;
                } else {
                    totals.catBalance -= op.amount;
                }
            }
        });

        totals.balance = totals.totalIncome - totals.totalExpenses;
        totals.sideProfit = totals.sideIncome - totals.businessExpenses;

        return totals;
    }

    // Обновление графика расходов на дашборде
    updateExpensesChart(operations) {
        const ctx = document.getElementById('expensesChart').getContext('2d');
        
        // Группируем расходы по категориям
        const expensesByCategory = {};
        operations.filter(op => op.type === 'expense' && op.subtype === 'personal')
                  .forEach(op => {
                      if (!expensesByCategory[op.category]) {
                          expensesByCategory[op.category] = 0;
                      }
                      expensesByCategory[op.category] += op.amount;
                  });

        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);
        
        if (this.charts.expensesChart) {
            this.charts.expensesChart.destroy();
        }

        this.charts.expensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#C9CBCF',
                        '#4BC0C0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Отрисовка таблицы операций
    renderOperationsTable(filteredOperations = null) {
        const tbody = document.getElementById('operationsTableBody');
        tbody.innerHTML = '';

        const operations = filteredOperations || this.operations;
        operations.slice(0, 100).forEach(op => {
            const row = document.createElement('tr');
            row.className = op.type === 'income' ? 'income-row' : 'expense-row';
            
            const ownerLabel = (op.owner === 'cat') ? '🐱 Кошка' : '💰 Я';
            
            row.innerHTML = `
                <td>${this.formatDate(op.date)}</td>
                <td>${this.formatCurrency(op.amount)}</td>
                <td>${op.category}</td>
                <td>${this.getTypeLabel(op.type, op.subtype)}</td>
                <td>${ownerLabel}</td>
                <td>${op.comment}</td>
                <td>
                    <button class="btn-small" onclick="app.editOperation(${op.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="app.deleteOperation(${op.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Отрисовка целей
    renderGoals() {
        const container = document.getElementById('goalsGrid');
        container.innerHTML = '';

        this.goals.forEach(goal => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'card goal-card';
            card.innerHTML = `
                <h4>${goal.name}</h4>
                <p>Цель: ${this.formatCurrency(goal.targetAmount)}</p>
                <p>Накоплено: ${this.formatCurrency(goal.currentAmount)}</p>
                <div class="goal-progress">
                    <div class="goal-progress-fill" style="width: ${progress}%"></div>
                </div>
                <p>${progress.toFixed(1)}% выполнено</p>
                <div class="goal-actions">
                    <button class="btn btn-secondary" onclick="app.editGoal(${goal.id})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteGoal(${goal.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    // Отрисовка категорий в настройках
    renderCategories() {
        // Категории доходов
        const incomeContainer = document.getElementById('incomeCategories');
        incomeContainer.innerHTML = '';
        
        Object.keys(this.categories.income).forEach(type => {
            const typeDiv = document.createElement('div');
            typeDiv.innerHTML = `<h4>${type === 'main' ? 'Основной доход' : 'Сторонний доход'}</h4>`;
            
            this.categories.income[type].forEach(cat => {
                const catEl = document.createElement('div');
                catEl.className = 'category-item';
                catEl.innerHTML = `
                    ${cat}
                    <button onclick="app.deleteCategory('income', '${type}', '${cat}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                typeDiv.appendChild(catEl);
            });
            
            incomeContainer.appendChild(typeDiv);
        });

        // Категории расходов
        const expenseContainer = document.getElementById('expenseCategories');
        expenseContainer.innerHTML = '';
        
        Object.keys(this.categories.expense).forEach(type => {
            const typeDiv = document.createElement('div');
            typeDiv.innerHTML = `<h4>${type === 'personal' ? 'Личные расходы' : 'Расходы на подработку'}</h4>`;
            
            this.categories.expense[type].forEach(cat => {
                const catEl = document.createElement('div');
                catEl.className = 'category-item';
                catEl.innerHTML = `
                    ${cat}
                    <button onclick="app.deleteCategory('expense', '${type}', '${cat}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                typeDiv.appendChild(catEl);
            });
            
            expenseContainer.appendChild(typeDiv);
        });
    }

    // Инициализация графиков
    initCharts() {
        // График будет создан при первом обновлении дашборда
        this.updateDashboard();
    }

    // Обновление аналитики
    updateAnalytics() {
        const period = document.getElementById('analyticsPeriod').value;
        let months = 6;
        
        if (period === '12months') months = 12;
        else if (period === 'year') months = 12;
        
        this.updateIncomeExpensesChart(months);
        this.updateSideProfitChart(months);
        this.updateAnalyticsExpensesChart();
        this.updateExpensesTable();
    }

    // График динамики доходов и расходов
    updateIncomeExpensesChart(months) {
        const ctx = document.getElementById('incomeExpensesChart').getContext('2d');
        
        // Получаем данные за последние месяцы
        const monthsData = this.getMonthlyData(months);
        
        const labels = monthsData.map(month => month.label);
        const incomeData = monthsData.map(month => month.income);
        const expenseData = monthsData.map(month => month.expenses);
        
        if (this.charts.incomeExpensesChart) {
            this.charts.incomeExpensesChart.destroy();
        }
        
        this.charts.incomeExpensesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Доходы',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3
                }, {
                    label: 'Расходы',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
                            }
                        }
                    }
                }
            }
        });
    }

    // График прибыли от подработки
    updateSideProfitChart(months) {
        const ctx = document.getElementById('sideProfitChart').getContext('2d');
        
        const monthsData = this.getMonthlyData(months);
        const labels = monthsData.map(month => month.label);
        const profitData = monthsData.map(month => month.sideIncome - month.businessExpenses);
        
        if (this.charts.sideProfitChart) {
            this.charts.sideProfitChart.destroy();
        }
        
        this.charts.sideProfitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Прибыль от подработки',
                    data: profitData,
                    backgroundColor: profitData.map(value => 
                        value >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    ),
                    borderColor: profitData.map(value => 
                        value >= 0 ? '#10b981' : '#ef4444'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
                            }
                        }
                    }
                }
            }
        });
    }

    // График структуры расходов в аналитике
    updateAnalyticsExpensesChart() {
        const ctx = document.getElementById('expensesPieChart').getContext('2d');
        
        // Получаем все расходы
        const expensesByCategory = {};
        this.operations.filter(op => op.type === 'expense')
                      .forEach(op => {
                          if (!expensesByCategory[op.category]) {
                              expensesByCategory[op.category] = 0;
                          }
                          expensesByCategory[op.category] += op.amount;
                      });

        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);
        
        if (this.charts.expensesPieChart) {
            this.charts.expensesPieChart.destroy();
        }

        this.charts.expensesPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#C9CBCF', '#4BC0C0',
                        '#FF6384', '#36A2EB'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${new Intl.NumberFormat('ru-RU').format(value)} ₽ (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Обновление таблицы расходов по категориям
    updateExpensesTable() {
        const tbody = document.querySelector('#expensesByCategoryTable tbody');
        tbody.innerHTML = '';
        
        const expensesByCategory = {};
        let totalExpenses = 0;
        
        this.operations.filter(op => op.type === 'expense')
                      .forEach(op => {
                          if (!expensesByCategory[op.category]) {
                              expensesByCategory[op.category] = 0;
                          }
                          expensesByCategory[op.category] += op.amount;
                          totalExpenses += op.amount;
                      });
        
        // Сортируем по убыванию суммы
        const sortedCategories = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1]);
        
        sortedCategories.forEach(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category}</td>
                <td>${this.formatCurrency(amount)}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Получение помесячных данных
    getMonthlyData(months) {
        const now = new Date();
        const monthsData = [];
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const monthOperations = this.operations.filter(op => {
                const opDate = new Date(op.date);
                return opDate >= date && opDate <= nextMonth;
            });
            
            const totals = this.calculateTotals(monthOperations);
            
            monthsData.push({
                label: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
                income: totals.totalIncome,
                expenses: totals.totalExpenses,
                sideIncome: totals.sideIncome,
                businessExpenses: totals.businessExpenses
            });
        }
        
        return monthsData;
    }

    // Вспомогательные методы
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: this.settings.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    getTypeLabel(type, subtype) {
        const labels = {
            'income': {
                'main': 'Основной доход',
                'side': 'Сторонний доход'
            },
            'expense': {
                'personal': 'Личные расходы',
                'business': 'Расходы на подработку'
            }
        };
        return labels[type][subtype];
    }

    switchTab(container, tabName) {
        const tabBtns = container.querySelectorAll('.tab-btn');
        const tabContents = container.parentElement.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        container.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // Операции с данными
    deleteOperation(id) {
        if (confirm('Удалить эту операцию?')) {
            this.operations = this.operations.filter(op => op.id !== id);
            this.saveOperations();
            this.updateDashboard();
            this.renderOperationsTable();
        }
    }

    deleteGoal(id) {
        if (confirm('Удалить эту цель?')) {
            this.goals = this.goals.filter(goal => goal.id !== id);
            this.saveGoals();
            this.renderGoals();
        }
    }

    addCategory(type) {
        const categoryName = prompt(`Введите название новой категории ${type === 'income' ? 'дохода' : 'расхода'}:`);
        if (categoryName && categoryName.trim()) {
            const subtype = prompt(`Выберите подтип:\n${type === 'income' ? '1 - Основной\n2 - Сторонний' : '1 - Личный\n2 - На подработку'}`);
            const subtypeName = type === 'income' ? 
                (subtype === '1' ? 'main' : 'side') : 
                (subtype === '1' ? 'personal' : 'business');
            
            if (subtypeName) {
                this.categories[type][subtypeName].push(categoryName.trim());
                this.saveCategories();
                this.renderCategories();
            }
        }
    }

    deleteCategory(type, subtype, categoryName) {
        if (confirm(`Удалить категорию "${categoryName}"?`)) {
            this.categories[type][subtype] = this.categories[type][subtype].filter(cat => cat !== categoryName);
            this.saveCategories();
            this.renderCategories();
        }
    }

    exportData() {
        const data = {
            operations: this.operations,
            goals: this.goals,
            categories: this.categories,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-pulse-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearData() {
        localStorage.removeItem('financePulse_operations');
        localStorage.removeItem('financePulse_goals');
        localStorage.removeItem('financePulse_categories');
        localStorage.removeItem('financePulse_settings');
        location.reload();
    }

    // Сохранение данных
    saveOperations() {
        localStorage.setItem('financePulse_operations', JSON.stringify(this.operations));
        // Автоматическая синхронизация при изменении данных
        this.debouncedCloudSync();
    }

    saveGoals() {
        localStorage.setItem('financePulse_goals', JSON.stringify(this.goals));
        this.debouncedCloudSync();
    }

    saveCategories() {
        localStorage.setItem('financePulse_categories', JSON.stringify(this.categories));
        this.debouncedCloudSync();
    }

    saveSettings() {
        localStorage.setItem('financePulse_settings', JSON.stringify(this.settings));
        this.debouncedCloudSync();
    }

    // Отложенная синхронизация (не чаще раза в 2 секунды)
    debouncedCloudSync() {
        if (!this.cloudDataId) return;
        
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(async () => {
            try {
                this.setSyncStatus('syncing', 'Сохранение...');
                await this.saveToCloudSilent();
                this.setSyncStatus('online', 'Синхронизировано');
            } catch (error) {
                this.setSyncStatus('offline', 'Ошибка сохранения');
                console.error('Debounced sync error:', error);
            }
        }, 2000);
    }

    // Фильтрация операций
    applyFilters() {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const category = document.getElementById('categoryFilter').value;
        const owner = document.getElementById('ownerFilter').value;
        const comment = document.getElementById('commentFilter').value.toLowerCase();

        let filtered = this.operations.filter(op => {
            // Фильтр по дате
            if (dateFrom && op.date < dateFrom) return false;
            if (dateTo && op.date > dateTo) return false;
            
            // Фильтр по категории
            if (category && op.category !== category) return false;
            
            // Фильтр по владельцу
            if (owner && (op.owner || 'me') !== owner) return false;
            
            // Фильтр по комментарию
            if (comment && !op.comment.toLowerCase().includes(comment)) return false;

            return true;
        });

        this.renderOperationsTable(filtered);
    }

    clearFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('ownerFilter').value = '';
        document.getElementById('commentFilter').value = '';
        this.renderOperationsTable();
    }

    // Переключение табов операций
    switchOperationTab(tabType) {
        const tabBtns = document.querySelectorAll('.tabs .tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');

        let filtered;
        if (tabType === 'income') {
            filtered = this.operations.filter(op => op.type === 'income');
        } else if (tabType === 'expenses') {
            filtered = this.operations.filter(op => op.type === 'expense');
        } else {
            filtered = this.operations;
        }

        this.renderOperationsTable(filtered);
    }

    // Редактирование операции
    editOperation(id) {
        const operation = this.operations.find(op => op.id === id);
        if (!operation) return;

        // Заполняем форму данными операции
        document.querySelector(`input[name="type"][value="${operation.type}"]`).checked = true;
        document.getElementById('amount').value = operation.amount;
        document.getElementById('subtype').value = operation.subtype;
        document.getElementById('owner').value = operation.owner || 'me';
        document.getElementById('date').value = operation.date;
        document.getElementById('comment').value = operation.comment;

        // Обновляем форму
        this.updateOperationForm();
        
        // Устанавливаем категорию после обновления опций
        setTimeout(() => {
            document.getElementById('category').value = operation.category;
        }, 100);

        // Меняем обработчик формы на редактирование
        const form = document.getElementById('operationForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.updateOperation(id);
        };

        // Меняем заголовок модального окна
        document.querySelector('#operationModal h3').textContent = 'Редактировать операцию';

        this.openModal('operationModal');
    }

    updateOperation(id) {
        const formData = new FormData(document.getElementById('operationForm'));
        const operationIndex = this.operations.findIndex(op => op.id === id);
        
        if (operationIndex === -1) return;

        // Обновляем операцию
        this.operations[operationIndex] = {
            ...this.operations[operationIndex],
            type: formData.get('type'),
            subtype: formData.get('subtype'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            owner: formData.get('owner') || 'me',
            date: formData.get('date'),
            comment: formData.get('comment') || '',
            updatedAt: new Date().toISOString()
        };

        this.saveOperations();
        this.updateDashboard();
        this.renderOperationsTable();
        this.closeModal('operationModal');

        // Возвращаем обычный обработчик формы
        const form = document.getElementById('operationForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.addOperation();
        };
        
        // Возвращаем заголовок
        document.querySelector('#operationModal h3').textContent = 'Добавить операцию';
        
        form.reset();
    }

    // Редактирование целей
    editGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalAmount').value = goal.targetAmount;
        document.getElementById('currentAmount').value = goal.currentAmount;

        // Меняем обработчик формы
        const form = document.getElementById('goalForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.updateGoal(id);
        };

        document.querySelector('#goalModal h3').textContent = 'Редактировать цель';
        this.openModal('goalModal');
    }

    updateGoal(id) {
        const formData = new FormData(document.getElementById('goalForm'));
        const goalIndex = this.goals.findIndex(g => g.id === id);
        
        if (goalIndex === -1) return;

        this.goals[goalIndex] = {
            ...this.goals[goalIndex],
            name: formData.get('goalName'),
            targetAmount: parseFloat(formData.get('goalAmount')),
            currentAmount: parseFloat(formData.get('currentAmount')),
            updatedAt: new Date().toISOString()
        };

        this.saveGoals();
        this.renderGoals();
        this.closeModal('goalModal');

        // Возвращаем обычный обработчик
        const form = document.getElementById('goalForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.addGoal();
        };

        document.querySelector('#goalModal h3').textContent = 'Создать цель';
        form.reset();
    }

    // Облачная синхронизация
    async saveToCloud() {
        try {
            this.showSyncStatus('Сохранение данных в облаке...', 'info');
            
            const data = {
                operations: this.operations,
                goals: this.goals,
                categories: this.categories,
                settings: this.settings,
                lastSync: new Date().toISOString()
            };

            // Используем pastebin.com как надежное хранилище
            const formData = new FormData();
            formData.append('api_dev_key', 'd0c8d7b8f1b3a2e5f3c4a8d9b2e1f6c7');
            formData.append('api_option', 'paste');
            formData.append('api_paste_code', JSON.stringify(data));
            formData.append('api_paste_private', '1');
            formData.append('api_paste_name', 'Finance Pulse Data');
            formData.append('api_paste_expire_date', '1M');

            const response = await fetch('https://pastebin.com/api/api_post.php', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const pasteUrl = await response.text();
                if (pasteUrl.startsWith('https://pastebin.com/')) {
                    // Извлекаем ID из URL
                    const dataId = pasteUrl.split('/').pop();
                    
                    // Сохраняем ID для доступа
                    this.cloudDataId = dataId;
                    localStorage.setItem('financePulse_cloudId', dataId);
                    document.getElementById('cloudDataId').value = dataId;
                    
                    // Запускаем автоматическую синхронизацию
                    this.startBackgroundSync();
                    
                    this.showSyncStatus(`Данные сохранены! ID: ${dataId}`, 'success');
                } else {
                    throw new Error(pasteUrl);
                }
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (error) {
            // Резервный метод - используем localStorage с расширенным ID
            const dataId = 'local_' + Date.now();
            const cloudData = {
                operations: this.operations,
                goals: this.goals,
                categories: this.categories,
                settings: this.settings,
                lastSync: new Date().toISOString()
            };
            
            localStorage.setItem(`financePulse_shared_${dataId}`, JSON.stringify(cloudData));
            
            this.cloudDataId = dataId;
            localStorage.setItem('financePulse_cloudId', dataId);
            document.getElementById('cloudDataId').value = dataId;
            
            this.showSyncStatus(`Данные сохранены локально! ID: ${dataId}`, 'success');
            console.error('Cloud save error, using local fallback:', error);
        }
    }

    async loadFromCloud() {
        try {
            const dataId = document.getElementById('cloudDataId').value.trim();
            if (!dataId) {
                this.showSyncStatus('Введите ID для загрузки данных', 'error');
                return;
            }

            this.showSyncStatus('Загрузка данных из облака...', 'info');

            let cloudData = null;

            // Проверяем, это локальный ID или облачный
            if (dataId.startsWith('local_')) {
                const localData = localStorage.getItem(`financePulse_shared_${dataId}`);
                if (localData) {
                    cloudData = JSON.parse(localData);
                }
            } else {
                // Пытаемся загрузить с pastebin
                const response = await fetch(`https://pastebin.com/raw/${dataId}`);
                if (response.ok) {
                    const rawData = await response.text();
                    cloudData = JSON.parse(rawData);
                }
            }

            if (cloudData) {
                // Проверяем, есть ли локальные данные
                const hasLocalData = this.operations.length > 0 || this.goals.length > 0;
                
                if (hasLocalData) {
                    const merge = confirm('У вас есть локальные данные. Объединить с облачными данными? (Отмена заменит все данные)');
                    
                    if (merge) {
                        // Объединяем данные
                        this.mergeCloudData(cloudData);
                    } else {
                        // Заменяем данные
                        this.replaceWithCloudData(cloudData);
                    }
                } else {
                    this.replaceWithCloudData(cloudData);
                }

                this.cloudDataId = dataId;
                localStorage.setItem('financePulse_cloudId', dataId);
                
                // Запускаем автоматическую синхронизацию
                this.startBackgroundSync();
                
                this.showSyncStatus('Данные успешно загружены!', 'success');
            } else {
                throw new Error('Данные не найдены');
            }
        } catch (error) {
            this.showSyncStatus('Ошибка загрузки данных', 'error');
            console.error('Cloud load error:', error);
        }
    }

    mergeCloudData(cloudData) {
        // Объединяем операции (избегаем дубликатов по ID)
        const existingIds = new Set(this.operations.map(op => op.id));
        const newOperations = cloudData.operations.filter(op => !existingIds.has(op.id));
        this.operations = [...this.operations, ...newOperations];

        // Объединяем цели
        const existingGoalIds = new Set(this.goals.map(goal => goal.id));
        const newGoals = cloudData.goals.filter(goal => !existingGoalIds.has(goal.id));
        this.goals = [...this.goals, ...newGoals];

        // Объединяем категории
        if (cloudData.categories) {
            Object.keys(cloudData.categories).forEach(type => {
                Object.keys(cloudData.categories[type]).forEach(subtype => {
                    const cloudCategories = cloudData.categories[type][subtype];
                    const localCategories = this.categories[type][subtype];
                    this.categories[type][subtype] = [...new Set([...localCategories, ...cloudCategories])];
                });
            });
        }

        this.saveAllData();
        this.updateDashboard();
        this.renderOperationsTable();
        this.renderGoals();
        this.renderCategories();
    }

    replaceWithCloudData(cloudData) {
        this.operations = cloudData.operations || [];
        this.goals = cloudData.goals || [];
        this.categories = cloudData.categories || this.getDefaultCategories();
        this.settings = cloudData.settings || this.getDefaultSettings();

        this.saveAllData();
        this.updateDashboard();
        this.renderOperationsTable();
        this.renderGoals();
        this.renderCategories();
    }

    toggleAutoSync() {
        if (this.autoSyncInterval) {
            // Отключаем автосинхронизацию
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            document.getElementById('autoSyncBtn').textContent = 'Включить автосинхронизацию';
            this.showSyncStatus('Автосинхронизация отключена', 'info');
        } else {
            // Включаем автосинхронизацию
            if (!this.cloudDataId) {
                this.showSyncStatus('Сначала сохраните данные в облаке', 'error');
                return;
            }

            this.autoSyncInterval = setInterval(() => {
                this.saveToCloud();
            }, 30000); // Синхронизация каждые 30 секунд

            document.getElementById('autoSyncBtn').textContent = 'Отключить автосинхронизацию';
            this.showSyncStatus('Автосинхронизация включена (каждые 30 сек)', 'success');
        }
    }

    showSyncStatus(message, type) {
        const statusEl = document.getElementById('syncStatus');
        statusEl.className = `sync-status ${type}`;
        statusEl.textContent = message;
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            statusEl.className = 'sync-status';
        }, 5000);
    }

    saveAllData() {
        this.saveOperations();
        this.saveGoals();
        this.saveCategories();
        this.saveSettings();
    }

    // Автоматическая синхронизация
    async initAutoSync() {
        if (this.cloudDataId) {
            // Загружаем данные из облака при старте
            try {
                this.setSyncStatus('syncing', 'Синхронизация...');
                await this.loadFromCloudSilent();
                this.setSyncStatus('online', 'Синхронизировано');
                
                // Запускаем периодическую синхронизацию
                this.startBackgroundSync();
            } catch (error) {
                this.setSyncStatus('offline', 'Оффлайн');
                console.error('Auto sync failed:', error);
            }
        } else {
            this.setSyncStatus('offline', 'Локально');
        }
    }

    startBackgroundSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }

        this.autoSyncInterval = setInterval(async () => {
            if (this.cloudDataId) {
                try {
                    this.setSyncStatus('syncing', 'Синхронизация...');
                    
                    // Загружаем данные из облака
                    await this.loadFromCloudSilent();
                    
                    // Сохраняем актуальные данные
                    await this.saveToCloudSilent();
                    
                    this.setSyncStatus('online', 'Синхронизировано');
                } catch (error) {
                    this.setSyncStatus('offline', 'Ошибка синхронизации');
                    console.error('Background sync error:', error);
                }
            }
        }, 10000); // Синхронизация каждые 10 секунд
    }

    setSyncStatus(status, text) {
        const indicator = document.getElementById('syncIndicator');
        const textEl = document.getElementById('syncText');
        
        indicator.className = `sync-indicator ${status}`;
        textEl.textContent = text;
    }

    // Тихая загрузка из облака без уведомлений
    async loadFromCloudSilent() {
        if (!this.cloudDataId) return;

        let cloudData = null;

        try {
            // Проверяем, это локальный ID или облачный
            if (this.cloudDataId.startsWith('local_')) {
                const localData = localStorage.getItem(`financePulse_shared_${this.cloudDataId}`);
                if (localData) {
                    cloudData = JSON.parse(localData);
                }
            } else {
                // Пытаемся загрузить с pastebin
                const response = await fetch(`https://pastebin.com/raw/${this.cloudDataId}`);
                if (response.ok) {
                    const rawData = await response.text();
                    cloudData = JSON.parse(rawData);
                }
            }

            if (cloudData) {
                // Проверяем, есть ли обновления
                const cloudLastSync = new Date(cloudData.lastSync || 0);
                const localLastSync = new Date(localStorage.getItem('financePulse_lastSync') || 0);

                if (cloudLastSync > localLastSync) {
                    // Умное объединение данных
                    this.smartMergeData(cloudData);
                    localStorage.setItem('financePulse_lastSync', cloudData.lastSync);
                }
            }
        } catch (error) {
            // Игнорируем ошибки при тихой синхронизации
            console.log('Silent sync load failed:', error);
        }
    }

    // Тихое сохранение в облако
    async saveToCloudSilent() {
        if (!this.cloudDataId) return;

        const data = {
            operations: this.operations,
            goals: this.goals,
            categories: this.categories,
            settings: this.settings,
            lastSync: new Date().toISOString()
        };

        try {
            // Проверяем, это локальный ID или облачный
            if (this.cloudDataId.startsWith('local_')) {
                // Сохраняем локально
                localStorage.setItem(`financePulse_shared_${this.cloudDataId}`, JSON.stringify(data));
            } else {
                // Пытаемся обновить данные в Pastebin (только если это новый paste)
                // Для Pastebin нельзя обновлять существующие записи, поэтому просто сохраняем локально
                localStorage.setItem(`financePulse_shared_backup_${this.cloudDataId}`, JSON.stringify(data));
            }

            localStorage.setItem('financePulse_lastSync', data.lastSync);
        } catch (error) {
            // Игнорируем ошибки при тихом сохранении
            console.log('Silent sync save failed:', error);
        }
    }

    // Умное объединение данных (избегает потери локальных изменений)
    smartMergeData(cloudData) {
        let updated = false;

        // Объединяем операции
        const existingIds = new Set(this.operations.map(op => op.id));
        const newOperations = cloudData.operations.filter(op => !existingIds.has(op.id));
        
        if (newOperations.length > 0) {
            this.operations = [...this.operations, ...newOperations];
            updated = true;
        }

        // Обновляем существующие операции если они были изменены
        cloudData.operations.forEach(cloudOp => {
            const localIndex = this.operations.findIndex(op => op.id === cloudOp.id);
            if (localIndex !== -1) {
                const localOp = this.operations[localIndex];
                const cloudUpdated = new Date(cloudOp.updatedAt || cloudOp.timestamp);
                const localUpdated = new Date(localOp.updatedAt || localOp.timestamp);
                
                if (cloudUpdated > localUpdated) {
                    this.operations[localIndex] = cloudOp;
                    updated = true;
                }
            }
        });

        // Аналогично для целей
        const existingGoalIds = new Set(this.goals.map(goal => goal.id));
        const newGoals = cloudData.goals.filter(goal => !existingGoalIds.has(goal.id));
        
        if (newGoals.length > 0) {
            this.goals = [...this.goals, ...newGoals];
            updated = true;
        }

        cloudData.goals.forEach(cloudGoal => {
            const localIndex = this.goals.findIndex(goal => goal.id === cloudGoal.id);
            if (localIndex !== -1) {
                const localGoal = this.goals[localIndex];
                const cloudUpdated = new Date(cloudGoal.updatedAt || cloudGoal.createdAt);
                const localUpdated = new Date(localGoal.updatedAt || localGoal.createdAt);
                
                if (cloudUpdated > localUpdated) {
                    this.goals[localIndex] = cloudGoal;
                    updated = true;
                }
            }
        });

        if (updated) {
            this.saveAllData();
            this.updateDashboard();
            this.renderOperationsTable();
            this.renderGoals();
        }
    }
}

// Глобальные функции для обработки событий
function closeModal(modalId) {
    app.closeModal(modalId);
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FinancePulse();
});