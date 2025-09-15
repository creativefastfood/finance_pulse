// Финансовый Пульс - Основной JavaScript файл

class FinancePulse {
    constructor() {
        this.operations = JSON.parse(localStorage.getItem('financePulse_operations')) || [];
        this.goals = JSON.parse(localStorage.getItem('financePulse_goals')) || [];
        this.categories = JSON.parse(localStorage.getItem('financePulse_categories')) || this.getDefaultCategories();
        this.settings = JSON.parse(localStorage.getItem('financePulse_settings')) || this.getDefaultSettings();
        
        this.charts = {};
        this.currentSection = 'dashboard';
        
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
            sideProfit: 0
        };

        operations.forEach(op => {
            if (op.type === 'income') {
                totals.totalIncome += op.amount;
                if (op.subtype === 'main') {
                    totals.mainIncome += op.amount;
                } else {
                    totals.sideIncome += op.amount;
                }
            } else {
                totals.totalExpenses += op.amount;
                if (op.subtype === 'personal') {
                    totals.personalExpenses += op.amount;
                } else {
                    totals.businessExpenses += op.amount;
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
    renderOperationsTable() {
        const tbody = document.getElementById('operationsTableBody');
        tbody.innerHTML = '';

        this.operations.slice(0, 50).forEach(op => {
            const row = document.createElement('tr');
            row.className = op.type === 'income' ? 'income-row' : 'expense-row';
            
            row.innerHTML = `
                <td>${this.formatDate(op.date)}</td>
                <td>${this.formatCurrency(op.amount)}</td>
                <td>${op.category}</td>
                <td>${this.getTypeLabel(op.type, op.subtype)}</td>
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
                <button class="btn btn-danger" onclick="app.deleteGoal(${goal.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
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
    }

    saveGoals() {
        localStorage.setItem('financePulse_goals', JSON.stringify(this.goals));
    }

    saveCategories() {
        localStorage.setItem('financePulse_categories', JSON.stringify(this.categories));
    }

    saveSettings() {
        localStorage.setItem('financePulse_settings', JSON.stringify(this.settings));
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