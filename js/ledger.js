document.addEventListener('DOMContentLoaded', function() {

    // ================================= common =================================

    function unixTimeToFormattedString(unixTimestamp) {
        // 创建一个 Date 对象，将 UNIX 时间戳乘以 1000 转换为毫秒级
        let date = new Date(unixTimestamp * 1000);
      
        // 获取年、月、日、小时、分钟、秒
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1，并补齐两位
        let day = String(date.getDate()).padStart(2, '0');
        let hours = String(date.getHours()).padStart(2, '0');
        let minutes = String(date.getMinutes()).padStart(2, '0');
        let seconds = String(date.getSeconds()).padStart(2, '0');
      
        // 构建格式化的日期时间字符串
        let formattedString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
        return formattedString;
    }


    // ================================= page =================================
    
    // ユーザー名を取得して表示する関数
    function fetchNickname() {
        $.ajax({
            url: 'php/get_nickname.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if(data && data.nickname) {
                    $('#nickname').text(data.nickname);
                }
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    }

    // logout button
    $('#logout-button').on('click', () => {
        $.ajax({
            url: 'php/logout.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if(data && data.success) {
                    // 退出成功，重定向到登录页或主页
                    alert('ログアウトしました。');
                    window.location.href = 'index.html';
                } else {
                    alert('ログアウトに失敗しました。');
                }
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    });

    // banding click event to tab buttons
    $('.nav-link').on('click', function() {
        const tabId = $(this).attr('href');
        switch (tabId) {
            case '#overview':
                loadOverviewData();
                break;
            case '#accounting':
                setupAccountingTab();
                break;
            case '#details':
                fetchTransactionDetails(currentPage, 'all');
                break;
            case '#import':
                // TODO
                break;
            // case '#export':
                // TODO
            default:
                break;
        }
    });


    // ========== page 初期化 ==========
    // デフォルト　タブ　初期化
    //$('.nav-tabs a[href="#overview"]').tab('show'); // overview を デフォルト タブ に 設置
    fetchNickname();  // ユーザー名を取得する関数を呼び出し
    loadOverviewData(); // overview のダークをローディング

    
    // ================================= overview ==================================
    
    function loadOverviewData() {
        setYearAndMonth();
        fetch('php/get_overview_data.php')
            .then(response => response.json())
            .then(data => {
                changeAmountsDigits(data.overview_data, 0);
                displayOverviewData(data.overview_data);
                // 解析每日数据
                let dailyIncomeData = [];
                let dailyExpenseData = [];
                for (let day = 1; day <= getDaysInCurrentMonth(); day++) {
                    dailyIncomeData.push(data.daily_data[day] ? data.daily_data[day].daily_income : 0);
                    dailyExpenseData.push(data.daily_data[day] ? data.daily_data[day].daily_expense : 0);
                }
                // 使用新的每日数据生成图表
                generateMonthChart(dailyIncomeData, dailyExpenseData); 
            })
            .catch(error => console.error('Error:', error));
    }

    function setYearAndMonth() {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        $('.year-number').text(year);
        $('.month-number').text(month);
    }

    function changeAmountsDigits(data, digit) {
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                data[key] = Math.floor(data[key]*10**digit) / 10**digit;
            }
        }
    }

    function displayOverviewData(data) {
        const formatter = new Intl.NumberFormat('ja-JP'); // 使用日本格式
        document.getElementById('balance').textContent = formatter.format(data.balance);
        document.getElementById('total-income').textContent = formatter.format(data.total_income);
        document.getElementById('total-expense').textContent = formatter.format(data.total_expense);
        document.getElementById('monthly-expense').textContent = formatter.format(data.monthly_expense);
        document.getElementById('monthly-income').textContent = formatter.format(data.monthly_income);
        document.getElementById('weekly-expense').textContent = formatter.format(data.weekly_expense);
        document.getElementById('weekly-income').textContent = formatter.format(data.weekly_income);
        document.getElementById('yearly-expense').textContent = formatter.format(data.yearly_expense);
        document.getElementById('yearly-income').textContent = formatter.format(data.yearly_income);
    }

    function getDaysInCurrentMonth() {
        const today = new Date();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfCurrentMonth = new Date(firstDayOfNextMonth - 1);
        return lastDayOfCurrentMonth.getDate();
    }

    let incomeExpenseChartInstance = null; // 存储图表实例
    function generateMonthChart(incomeData, expenseData) {
        const today = new Date();
        const currentMonth = today.getMonth(); // 当前月份
        const formattedMonth = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : currentMonth + 1; // 月份格式化为两位数字
        let monthLabels = [];
        for (let day = 1; day <= getDaysInCurrentMonth(); day++) {
            const formattedDay = day < 10 ? `0${day}` : day; // 日期格式化为两位数字
            monthLabels.push(`${formattedMonth}.${formattedDay}`);
        }
        // for debugging
        // console.log(monthLabels);
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        // 如果已存在图表实例，则先销毁
        if (incomeExpenseChartInstance) {
            incomeExpenseChartInstance.destroy();
        }
        incomeExpenseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: '収入',
                    data: incomeData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                }, {
                    label: '支出',
                    data: expenseData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                }]
            },
            options: {
                hover: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    


    // ================================== accounting ==================================

    // 为记账选项卡设置当前日期和时间
    function setupAccountingTab() {
        $('#type').val('expense');
        $('#amount').val('');
        $('#currency_id').val('1');
        const currentDate = new Date().toISOString().split('T')[0];
        $('#date').val(currentDate);
        const currentTime = new Date().toTimeString().split(' ')[0].substr(0, 5);
        $('#time').val(currentTime);
        $('#memo').val('');
    }

    function displayAccountingResult(message, isSuccess) {
        const accountingMessage = document.getElementById('accounting-message');
        accountingMessage.textContent = message;
        accountingMessage.className = isSuccess ? 'alert alert-success' : 'alert alert-danger';
        accountingMessage.style.display = 'block';
        // debug 暂时取消隐藏消息
        setTimeout(() => { accountingMessage.style.display = 'none'; }, 10*1000); // 10秒后隐藏消息
    }

    // 记账提交逻辑
    document.getElementById('accountingForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        // const happened_at = new Date(formData.get('date') + ' ' + formData.get('time')).getTime() / 1000 ;
        formData.append('happened_at', new Date(formData.get('date') + ' ' + formData.get('time')).getTime() / 1000 );

        fetch('php/add_entry.php', { // 向后端提交数据的API
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // 处理服务器的响应
            if (data.success) {
                setupAccountingTab();
                displayAccountingResult('記帳成功', true);
                // 可能需要根据需要清除表单或更新页面内容
            } else {
                displayAccountingResult('記帳失敗: ' + data.message, false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayAccountingResult('サーバーエラー', false);
        });

        //debug
        // fetch('php/add_entry.php', { // 向后端提交数据的API
        //     method: 'POST',
        //     body: formData
        // })
        // .then(response => response.text())
        // .then(data => {
        //     displayAccountingResult(data, false);
        // })
        // .catch(error => {
        //     console.error('Error:', error);
        //     //displayAccountingResult('记账过程中出现错误', false);
        // });
    });


    // ================================== transactions ==================================
    
    const filterTypeSelect = document.getElementById('filter-type');
    const pageSizeSelect = document.getElementById('page-size');
    let currentPage = 1;
    let totalPages = 10; // 默认有10页

    // 筛选逻辑
    filterTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        // for debug
        // console.log('Selected type:', selectedType);
        fetchTransactionDetails(currentPage, selectedType);
    });

    // 页大小选择更改事件
    pageSizeSelect.addEventListener('change', function() {
        fetchTransactionDetails(currentPage, filterTypeSelect.value);
    });

    // 更新页码和上下页按钮链接
    function updatePagination(currentPage, totalPages) {
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';
    
        // 创建前一页链接
        const prevLi = document.createElement('li');
        prevLi.className = 'page-item ' + (currentPage === 1 ? 'disabled' : '');
        prevLi.innerHTML = `<a class="page-link" href="#">前のページ</a>`;
        pagination.appendChild(prevLi);
    
        // 创建页码
        for (let page = 1; page <= totalPages; page++) {
            const li = document.createElement('li');
            if (page === currentPage) {
                li.className = 'page-item active';
            } else {
                li.className = 'page-item';
                li.addEventListener('click', () => {
                    fetchTransactionDetails(page, filterTypeSelect.value);
                });
            }

            // li.className = 'page-item ' + (page === currentPage ? 'active' : '');
            li.innerHTML = `<a class="page-link" href="#">${page}</a>`;
            pagination.appendChild(li);
        }
    
        // 创建后一页链接
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item ' + (currentPage === totalPages ? 'disabled' : '');
        nextLi.innerHTML = `<a class="page-link" href="#">次のページ</a>`;
        pagination.appendChild(nextLi);
    
        // 绑定翻页事件（TODO 确认是否能放在这个函数外面）
        prevLi.addEventListener('click', () => {
            if (currentPage > 1) fetchTransactionDetails(currentPage - 1, filterTypeSelect.value);
        });
        nextLi.addEventListener('click', () => {
            if (currentPage < totalPages) fetchTransactionDetails(currentPage + 1, filterTypeSelect.value);
        });
    }

    // 获取交易明细(调用显示明细函数)
    function fetchTransactionDetails(page, type) {
        currentPage = page;
        const pageSize = pageSizeSelect.value;
        // for debug
        // console.log(`php/get_transactions.php?page=${page}&type=${type}&limit=${pageSize}`);
        fetch(`php/get_transactions.php?page=${page}&type=${type}&limit=${pageSize}`)
            .then(response => response.json())
            .then(data => {
                // for debug
                // console.log(data);
                displayTransactionDetails(data.transactions); // 显示交易明细
                updatePagination(page, data.totalPages); // 更新翻页导航
            })
            .catch(error => console.error('Error:', error));
        
        // debug 用
        // fetch(`php/get_transactions.php?page=${page}&type=${type}`)
        //     .then(response => response.text())
        //     .then(data => {
        //         console.log(data);
        //     })
        //     .catch(error => console.error('Error:', error));
    }

    // 显示交易明细
    function displayTransactionDetails(transactions) {
        const transactionTypeMap = {
            'expense': '支出',
            'income': '収入',
            'default': '其他'
        };
        const detailsTableBody = document.getElementById('transaction-details');
        detailsTableBody.innerHTML = '';
        transactions.forEach(transaction => {
            const tr = document.createElement('tr');
            // console.log(transaction); // for debug
            tr.innerHTML = `
                <td>${unixTimeToFormattedString(transaction.happened_at)}</td>
                <td>${ transactionTypeMap[transaction.type] || transactionTypeMap['default'] }</td>
                <td class="text-right">${Math.floor(transaction.amount)}</td>
                <td>${transaction.currency}</td>
                <td style="word-break: break-all;">${transaction.description}</td>
                <td>
                    <button class="btn btn-info edit-btn" data-id="${transaction.id}">編集</button>
                    <button class="btn btn-danger delete-btn" data-id="${transaction.id}">削除</button>
                </td>
            `;
            detailsTableBody.appendChild(tr);
        });
    }

    // 在表格的tbody上添加事件委托
    document.getElementById('transaction-details').addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-btn')) {
            editTransaction(event.target.getAttribute('data-id'));
        } else if (event.target.classList.contains('delete-btn')) {
            deleteTransaction(event.target.getAttribute('data-id'));
        }
    });

    // 显示编辑模态框并填充数据
    function editTransaction(transactionId) {
        fetch(`php/get_transaction_details.php?id=${transactionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 设置表单字段的值
                const transaction = data.transaction;
                document.getElementById('edit-id').value = transaction.id;
                document.getElementById('edit-type').value = transaction.type;
                document.getElementById('edit-amount').value = transaction.amount;
                document.getElementById('edit-memo').value = transaction.description;

                // 解析并设置日期和时间
                const happened_at = unixTimeToFormattedString(transaction.happened_at);
                // for debugging
                // console.log(happened_at);
                document.getElementById('edit-date').value = happened_at.split(' ')[0];
                document.getElementById('edit-time').value = happened_at.split(' ')[1].substr(0, 5);
                
                // 显示模态框
                // JQuery实现（Bootstrap4标准实现）
                $('#editModal').modal('show');
                // Javascript实现
                // const editModal = new bootstrap.Modal(document.getElementById('editModal'));
                // editModal.show();
                // for debugging
                // console.log("show editing modal.");
            } else {
                console.error('データの取得に失敗しました: ', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    document.getElementById('editForm').addEventListener('submit', function(event) {
        event.preventDefault(); // 阻止表单默认提交
    
        const formData = new FormData(this);
        // 由于表单现在包含所有必要的字段，不再需要单独追加
        const date = document.getElementById('edit-date').value;
        const time = document.getElementById('edit-time').value;
        const happenedAt = new Date(`${date}T${time}`).getTime() / 1000;
        formData.append('happened_at', happenedAt);
        formData.append('currency_id', 1); // JPY as default currency
        
        // for debugging 
        // formData.forEach((value, key) => {
        //     console.log(`${key}: ${value}`);
        // });

        fetch('php/edit_transaction.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // for debugging
                // console.log('編集成功');
                $('#editModal').modal('hide');
                // for debugging
                // console.log(currentPage);
                // 重新加载交易明细
                fetchTransactionDetails(currentPage, document.getElementById('filter-type').value);
            } else {
                console.error('編集失敗: ', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    });
        
    // 交易明细中删除按钮的动作
    function deleteTransaction(transactionId) {
        if (confirm('本当に削除しますか？')) {
            fetch(`php/delete_transaction.php?id=${transactionId}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('削除成功');
                    // 重新加载交易明细
                    fetchTransactionDetails(1, 'all');
                } else {
                    console.error('削除失敗: ', data.error);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }

    

    // ================================== export ==================================

    document.getElementById('export-button').addEventListener('click', function() {
        const selectedType = document.getElementById('filter-type').value;
        const exportUrl = `php/export_transactions.php?type=${selectedType}`;
    
        // 执行导出操作，例如通过窗口新标签打开导出链接
        window.open(exportUrl, '_blank');
    });

    // ================================== import ==================================

    // 处理CSV文件
    function parseCSV(csvData) {
        // 将CSV数据分割成行
        const lines = csvData.split('\n');
        // 跳过第一行（列名），从第二行开始处理数据
        return lines.slice(1).map(line => {
            return line.split(',').map(field => 
                field.replace(/^"(.+)"$/, '$1') // 去除字段两端的双引号
            ).reduce((obj, field, index) => {
                // 根据CSV列的索引为对象赋值
                switch (index) {
                    case 0: obj.happened_at = field; break;
                    case 1: obj.type = field; break;
                    case 2: obj.amount = field; break;
                    case 3: obj.currency = field; break;
                    case 4: obj.description = field; break;
                }
                return obj;
            }, {});
        });
    }

    // 显示预览交易明细
    function displayPreviewTransactionDetails(transactions) {
        const previewTableBody = document.getElementById('preview-table-body');
        previewTableBody.innerHTML = '';
        transactions.forEach(transaction => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.happened_at}</td>
                <td>${transaction.type}</td>
                <td class="text-right">${transaction.amount}</td>
                <td>${transaction.currency}</td>
                <td style="word-break: break-all;">${transaction.description}</td>
            `;
            previewTableBody.appendChild(tr);
        });
    }

    // 当选择的文件发生变化时，加载CSV的数据到预览表格
    document.getElementById('importFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const transactions = parseCSV(csvData);
            displayPreviewTransactionDetails(transactions);
        };
        reader.readAsText(file);
    });

    function displayImportResult(message, isSuccess) {
        const importResult = document.getElementById('import-result');
        importResult.textContent = message;
        importResult.className = isSuccess ? 'alert alert-success' : 'alert alert-danger';
        importResult.style.display = 'block';
        // debug 暂时取消隐藏消息
        setTimeout(() => { importResult.style.display = 'none'; }, 10*1000); // 10秒后隐藏消息
    }

    document.getElementById('importForm').addEventListener('submit', function(e) {
        e.preventDefault();
    
        const typeMapping = {
            '支出': 'expense',
            '収入': 'income'
        };
        const currencyMapping = {
            'JPY': '1',
            'CNY': '2',
            'USD': '3'
        };
        const tableBody = document.getElementById('preview-table-body');
        let allRows = tableBody.querySelectorAll('tr');
        let isSuccess = true;
        let errorMessage = [];

        allRows.forEach(row => {
            let cells = row.querySelectorAll('td');
            let formData = new FormData();
            
            // 应用映射转换
            let type = typeMapping[cells[1].textContent.trim()] || cells[1].textContent.trim();
            let currencyId = currencyMapping[cells[3].textContent.trim()] || cells[3].textContent.trim();
            let happenedAt = new Date(cells[0].textContent.trim()).getTime() / 1000;
    
            formData.append('type', type);
            formData.append('amount', cells[2].textContent.trim());
            formData.append('currency_id', currencyId);
            formData.append('happened_at', happenedAt);
            formData.append('memo', cells[4].textContent.trim());
    
            // 发送数据到后端
            fetch('php/add_entry.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('一つのレコードをインポート成功しました。');
                   
                } else {
                    console.error('一つのレコードをインポート失敗しました。');
                    isSuccess = false;
                    errorMessage.append(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                isSuccess = false;
                errorMessage.append('サーバーエラー');
            });
        });

        if (isSuccess) {
            displayImportResult('インポート成功', true);
            tableBody.innerHTML = '';
        } else {
            displayImportResult('インポート失敗: ' + errorMessage, false);
        }

    });
    

});