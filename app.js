// 数据管理
const Storage = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// 初始化默认用户
function initUsers() {
    const users = Storage.get('users');
    if (users.length === 0) {
        Storage.set('users', [{ username: 'admin', password: 'admin123' }]);
    }
}

// 认证管理
const Auth = {
    SESSION_KEY: 'currentUser',
    
    login(username, password) {
        const users = Storage.get('users');
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            Storage.set(this.SESSION_KEY, { username: user.username, role: 'admin' });
            return true;
        }
        return false;
    },
    
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },
    
    isLoggedIn() {
        return !!localStorage.getItem(this.SESSION_KEY);
    },
    
    getCurrentUser() {
        return Storage.get(this.SESSION_KEY);
    }
};

// 柜子相关操作
const CabinetManager = {
    key: 'cabinets',
    
    getAll() {
        return Storage.get(this.key);
    },
    
    add(name, location) {
        const cabinets = this.getAll();
        const cabinet = {
            id: Date.now(),
            name: name.trim(),
            location: location,
            createdAt: new Date().toISOString()
        };
        cabinets.push(cabinet);
        Storage.set(this.key, cabinets);
        return cabinet;
    },
    
    update(id, name, location) {
        const cabinets = this.getAll();
        const index = cabinets.findIndex(c => c.id === id);
        if (index !== -1) {
            cabinets[index].name = name.trim();
            cabinets[index].location = location;
            cabinets[index].updatedAt = new Date().toISOString();
            Storage.set(this.key, cabinets);
            return cabinets[index];
        }
        return null;
    },
    
    delete(id) {
        let cabinets = this.getAll();
        cabinets = cabinets.filter(c => c.id !== id);
        Storage.set(this.key, cabinets);
        ItemManager.deleteByCabinet(id);
    },
    
    count() {
        return this.getAll().length;
    },
    
    search(keyword, location) {
        const cabinets = this.getAll();
        return cabinets.filter(c => {
            const matchName = !keyword || c.name.toLowerCase().includes(keyword.toLowerCase());
            const matchLocation = !location || c.location === location;
            return matchName && matchLocation;
        });
    },
    
    globalSearch(keyword) {
        const cabinets = this.getAll();
        if (!keyword) return [];
        return cabinets.filter(c => 
            c.name.toLowerCase().includes(keyword.toLowerCase())
        );
    },
    
    getById(id) {
        const cabinets = this.getAll();
        return cabinets.find(c => c.id === id);
    }
};

// 物品相关操作
const ItemManager = {
    key: 'items',
    
    getAll() {
        return Storage.get(this.key);
    },
    
    add(name, cabinetId) {
        const items = this.getAll();
        const item = {
            id: Date.now(),
            name: name.trim(),
            cabinetId: parseInt(cabinetId),
            createdAt: new Date().toISOString()
        };
        items.push(item);
        Storage.set(this.key, items);
        return item;
    },
    
    update(id, name, cabinetId) {
        const items = this.getAll();
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index].name = name.trim();
            items[index].cabinetId = parseInt(cabinetId);
            items[index].updatedAt = new Date().toISOString();
            Storage.set(this.key, items);
            return items[index];
        }
        return null;
    },
    
    delete(id) {
        let items = this.getAll();
        items = items.filter(i => i.id !== id);
        Storage.set(this.key, items);
    },
    
    deleteByCabinet(cabinetId) {
        let items = this.getAll();
        items = items.filter(i => i.cabinetId !== cabinetId);
        Storage.set(this.key, items);
    },
    
    getByCabinet(cabinetId) {
        const items = this.getAll();
        return items.filter(i => i.cabinetId === cabinetId);
    },
    
    count() {
        return this.getAll().length;
    },
    
    getRecent(limit = 5) {
        const items = this.getAll();
        return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    },
    
    search(keyword) {
        const items = this.getAll();
        if (!keyword) return items;
        return items.filter(i => i.name.toLowerCase().includes(keyword.toLowerCase()));
    },
    
    globalSearch(keyword) {
        const items = this.getAll();
        if (!keyword) return [];
        return items.filter(i => 
            i.name.toLowerCase().includes(keyword.toLowerCase())
        );
    },
    
    getById(id) {
        const items = this.getAll();
        return items.find(i => i.id === id);
    }
};

// 全局搜索功能
function globalSearch() {
    const keyword = document.getElementById('globalSearch').value.trim();
    const resultsContainer = document.getElementById('globalSearchResults');
    
    if (!keyword) {
        resultsContainer.classList.remove('active');
        return;
    }
    
    const cabinets = CabinetManager.globalSearch(keyword);
    const items = ItemManager.globalSearch(keyword);
    
    let html = '';
    
    if (cabinets.length > 0) {
        html += '<div style="padding: 8px 20px; color: #667eea; font-weight: bold; background: #f8f9fa;">📦 柜子</div>';
        cabinets.forEach(cabinet => {
            const itemCount = ItemManager.getByCabinet(cabinet.id).length;
            html += '<div class="result-item" onclick="goToCabinet(' + cabinet.id + ')">' +
                '<span>📦 ' + highlightText(cabinet.name, keyword) + '</span>' +
                '<span class="result-type">位置: ' + (cabinet.location || '-') + ' | ' + itemCount + '个物品</span>' +
            '</div>';
        });
    }
    
    if (items.length > 0) {
        html += '<div style="padding: 8px 20px; color: #764ba2; font-weight: bold; background: #f8f9fa;">📦 物品</div>';
        items.forEach(item => {
            const cabinet = CabinetManager.getById(item.cabinetId);
            html += '<div class="result-item" onclick="goToItem(' + item.cabinetId + ')">' +
                '<span>📦 ' + highlightText(item.name, keyword) + '</span>' +
                '<span class="result-type">在: ' + (cabinet ? cabinet.name : '-') + '</span>' +
            '</div>';
        });
    }
    
    if (html === '') {
        html = '<div style="padding: 20px; text-align: center; color: #999;">未找到相关结果</div>';
    }
    
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('active');
}

// 跳转到柜子详情
function goToCabinet(cabinetId) {
    document.getElementById('globalSearch').value = '';
    document.getElementById('globalSearchResults').classList.remove('active');
    switchTab('cabinet');
}

// 跳转到物品
function goToItem(cabinetId) {
    document.getElementById('globalSearch').value = '';
    document.getElementById('globalSearchResults').classList.remove('active');
    switchTab('item');
}

// 点击其他地方关闭搜索结果
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.global-search');
    if (searchContainer && !searchContainer.contains(e.target)) {
        document.getElementById('globalSearchResults').classList.remove('active');
    }
});

// 点击其他地方关闭移动端导航菜单
document.addEventListener('click', function(e) {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.querySelector('.menu-toggle');
    if (navLinks && menuToggle) {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    }
});

// 点击其他地方关闭模态框
document.addEventListener('click', function(e) {
    const modal = document.getElementById('editCabinetModal');
    if (modal && e.target === modal) {
        closeEditCabinetModal();
    }
});

// 切换柜子表单显示
function toggleCabinetForm() {
    const formContainer = document.getElementById('cabinetFormContainer');
    const btn = document.getElementById('showCabinetFormBtn');
    
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        btn.innerHTML = '➖ 收起表单';
        btn.style.background = 'linear-gradient(135deg, #666 0%, #555 100%)';
    } else {
        formContainer.style.display = 'none';
        btn.innerHTML = '➕ 创建新柜子';
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.getElementById('cabinetForm').reset();
    }
}

// 切换物品表单显示
function toggleItemForm() {
    const formContainer = document.getElementById('itemFormContainer');
    const btn = document.getElementById('showItemFormBtn');
    
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        btn.innerHTML = '➖ 收起表单';
        btn.style.background = 'linear-gradient(135deg, #666 0%, #555 100%)';
        updateCabinetSelect();
    } else {
        formContainer.style.display = 'none';
        btn.innerHTML = '➕ 添加新物品';
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.getElementById('itemForm').reset();
    }
}

// Tab 切换
function switchTab(tabName) {
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.remove('active');
        if (a.dataset.tab === tabName) {
            a.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName + 'Tab').classList.add('active');
    document.getElementById('navLinks').classList.remove('active');

    if (tabName === 'dashboard') {
        UI.renderDashboard();
    } else if (tabName === 'cabinet') {
        const cabinetSearch = document.getElementById('cabinetSearch');
        const locationFilter = document.getElementById('locationFilter');
        if (cabinetSearch) cabinetSearch.value = '';
        if (locationFilter) locationFilter.value = '';
        UI.renderCabinets();
    } else if (tabName === 'item') {
        const itemSearch = document.getElementById('itemSearch');
        if (itemSearch) itemSearch.value = '';
        UI.renderItems();
        UI.updateCabinetSelect();
    }

    event.preventDefault();
}

// 打开编辑柜子模态框
function openEditCabinetModal(cabinetId) {
    const cabinet = CabinetManager.getById(cabinetId);
    if (!cabinet) return;
    
    document.getElementById('editCabinetId').value = cabinet.id;
    document.getElementById('editCabinetName').value = cabinet.name;
    document.getElementById('editCabinetLocation').value = cabinet.location;
    document.getElementById('editCabinetModal').classList.add('active');
}

// 关闭编辑柜子模态框
function closeEditCabinetModal() {
    document.getElementById('editCabinetModal').classList.remove('active');
    document.getElementById('editCabinetForm').reset();
}

// UI渲染
const UI = {
    renderCabinets(filteredCabinets) {
        const cabinets = filteredCabinets ? filteredCabinets : CabinetManager.getAll();
        const container = document.getElementById('cabinetList');
        const countBadge = document.getElementById('cabinetCount');
        
        countBadge.textContent = cabinets.length;
        
        if (cabinets.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999; padding: 30px;">暂无柜子数据</td></tr>';
            return;
        }
        
        const searchKeyword = document.getElementById('cabinetSearch') ? document.getElementById('cabinetSearch').value : '';
        
        container.innerHTML = cabinets.map((cabinet, index) => {
            const itemCount = ItemManager.getByCabinet(cabinet.id).length;
            const createdDate = new Date(cabinet.createdAt).toLocaleDateString('zh-CN');
            
            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + highlightText(cabinet.name, searchKeyword) + '</td>' +
                '<td><span class="badge badge-location">' + (cabinet.location || '-') + '</span></td>' +
                '<td><span class="badge">' + itemCount + '</span></td>' +
                '<td>' + createdDate + '</td>' +
                '<td>' +
                    '<button class="edit-btn" onclick="openEditCabinetModal(' + cabinet.id + ')">编辑</button>' +
                    '<button class="delete-btn" onclick="deleteCabinet(' + cabinet.id + ')">删除</button>' +
                '</td>' +
            '</tr>';
        }).join('');
    },
    
    renderItems(filteredItems) {
        const items = filteredItems ? filteredItems : ItemManager.getAll();
        const cabinets = CabinetManager.getAll();
        const container = document.getElementById('itemList');
        const countBadge = document.getElementById('itemCount');
        
        countBadge.textContent = items.length;
        
        if (items.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999; padding: 30px;">暂无物品数据</td></tr>';
            return;
        }
        
        const searchKeyword = document.getElementById('itemSearch') ? document.getElementById('itemSearch').value : '';
        
        container.innerHTML = items.map((item, index) => {
            const cabinet = cabinets.find(c => c.id === item.cabinetId);
            const createdDate = new Date(item.createdAt).toLocaleDateString('zh-CN');
            
            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + highlightText(item.name, searchKeyword) + '</td>' +
                '<td><span class="badge badge-cabinet">' + (cabinet ? cabinet.name : '-') + '</span></td>' +
                '<td><span class="badge badge-location">' + (cabinet ? cabinet.location : '-') + '</span></td>' +
                '<td>' + createdDate + '</td>' +
                '<td><button class="delete-btn" onclick="deleteItem(' + item.id + ')">删除</button></td>' +
            '</tr>';
        }).join('');
    },
    
    updateCabinetSelect() {
        const cabinets = CabinetManager.getAll();
        const select = document.getElementById('itemCabinet');
        
        select.innerHTML = '<option value="">请选择柜子</option>' + 
            cabinets.map(cabinet => 
                '<option value="' + cabinet.id + '">' + cabinet.name + '（' + (cabinet.location || '-') + '）</option>'
            ).join('');
    },
    
    renderDashboard() {
        const totalCabinets = CabinetManager.count();
        const totalItems = ItemManager.count();
        const avgItems = totalCabinets > 0 ? (totalItems / totalCabinets).toFixed(1) : 0;
        
        document.getElementById('totalCabinets').textContent = totalCabinets;
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('avgItems').textContent = avgItems;
        
        const cabinets = CabinetManager.getAll();
        const distributionContainer = document.getElementById('cabinetDistribution');
        
        if (cabinets.length === 0) {
            distributionContainer.innerHTML = '<p style="color: #999; text-align: center;">暂无数据</p>';
        } else {
            distributionContainer.innerHTML = cabinets.map(cabinet => {
                const count = ItemManager.getByCabinet(cabinet.id).length;
                const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(0) : 0;
                return '<div class="detail-item">' +
                    '<span>' + cabinet.name + ' <small>(' + (cabinet.location || '-') + ')</small></span>' +
                    '<span><span class="badge">' + count + '</span> (' + percentage + '%)</span>' +
                '</div>';
            }).join('');
        }
        
        const recentItems = ItemManager.getRecent(5);
        const recentContainer = document.getElementById('recentItems');
        
        if (recentItems.length === 0) {
            recentContainer.innerHTML = '<p style="color: #999; text-align: center;">暂无数据</p>';
        } else {
            const allCabinets = CabinetManager.getAll();
            recentContainer.innerHTML = recentItems.map(item => {
                const cabinet = allCabinets.find(c => c.id === item.cabinetId);
                const date = new Date(item.createdAt).toLocaleDateString('zh-CN');
                return '<div class="detail-item">' +
                    '<span>' + item.name + '</span>' +
                    '<span><span class="badge badge-cabinet">' + (cabinet ? cabinet.name : '-') + '</span> ' + date + '</span>' +
                '</div>';
            }).join('');
        }
    },
    
    render() {
        this.renderDashboard();
    }
};

// 高亮搜索文本
function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp('(' + keyword + ')', 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// 筛选柜子
function filterCabinets() {
    const keyword = document.getElementById('cabinetSearch').value;
    const location = document.getElementById('locationFilter').value;
    const filtered = CabinetManager.search(keyword, location);
    UI.renderCabinets(filtered);
}

// 筛选物品
function filterItems() {
    const keyword = document.getElementById('itemSearch').value;
    const filtered = ItemManager.search(keyword);
    UI.renderItems(filtered);
}

// 移动端菜单切换
function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (Auth.login(username, password)) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainPage').style.display = 'block';
        document.getElementById('errorMsg').style.display = 'none';
        UI.render();
        UI.renderCabinets();
        UI.renderItems();
        UI.updateCabinetSelect();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
});

// 柜子表单提交
document.getElementById('cabinetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('cabinetName');
    const locationSelect = document.getElementById('cabinetLocation');
    
    const name = nameInput.value.trim();
    const location = locationSelect.value;
    
    if (!name) {
        alert('请输入柜子名称');
        return;
    }
    
    if (!location) {
        alert('请选择柜子位置');
        return;
    }
    
    CabinetManager.add(name, location);
    nameInput.value = '';
    locationSelect.value = '';
    
    toggleCabinetForm();
    UI.renderCabinets();
    UI.renderDashboard();
});

// 编辑柜子表单提交
document.getElementById('editCabinetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('editCabinetId').value;
    const name = document.getElementById('editCabinetName').value.trim();
    const location = document.getElementById('editCabinetLocation').value;
    
    if (!name) {
        alert('请输入柜子名称');
        return;
    }
    
    if (!location) {
        alert('请选择柜子位置');
        return;
    }
    
    CabinetManager.update(parseInt(id), name, location);
    closeEditCabinetModal();
    UI.renderCabinets();
    UI.updateCabinetSelect();
    UI.renderItems();
    UI.renderDashboard();
});

// 物品表单提交
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('itemName');
    const cabinetSelect = document.getElementById('itemCabinet');
    
    const name = nameInput.value.trim();
    const cabinetId = cabinetSelect.value;
    
    if (!name) {
        alert('请输入物品名称');
        return;
    }
    
    if (!cabinetId) {
        alert('请选择柜子');
        return;
    }
    
    ItemManager.add(name, cabinetId);
    nameInput.value = '';
    cabinetSelect.value = '';
    
    toggleItemForm();
    UI.renderItems();
    UI.renderDashboard();
});

// 删除柜子
function deleteCabinet(id) {
    if (confirm('确定要删除这个柜子吗？柜子内的物品也会被删除')) {
        CabinetManager.delete(id);
        UI.renderCabinets();
        UI.updateCabinetSelect();
        UI.renderItems();
        UI.renderDashboard();
    }
}

// 删除物品
function deleteItem(id) {
    if (confirm('确定要删除这个物品吗？')) {
        ItemManager.delete(id);
        UI.renderItems();
        UI.renderDashboard();
    }
}

// 登出
function logout() {
    if (confirm('确定要登出吗？')) {
        Auth.logout();
        document.getElementById('mainPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('globalSearch').value = '';
        document.getElementById('globalSearchResults').classList.remove('active');
    }
}

// 页面加载时检查登录状态
window.onload = function() {
    initUsers();
    if (Auth.isLoggedIn()) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainPage').style.display = 'block';
        UI.render();
        UI.renderCabinets();
        UI.renderItems();
        UI.updateCabinetSelect();
    } else {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainPage').style.display = 'none';
    }
};
