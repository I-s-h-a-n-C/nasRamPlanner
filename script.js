// Preset configurations
const presets = {
    home: {
        nasModel: 'Home NAS',
        currentRAM: '4',
        maxRAM: '16',
        numDrives: '4',
        driveCapacity: '2000',
        raidType: 'raid5',
        primaryUse: 'backup',
        numUsers: '3',
        cpuCores: '4',
        osType: 'synology',
        priority: 'balanced',
        networkSpeed: '1',
        internetConnected: 'yes',
        remoteAccess: 'port-forward',
        botProtection: 'basic',
        ddrType: 'ddr4'
    },
    media: {
        nasModel: 'Media Server',
        currentRAM: '8',
        maxRAM: '32',
        numDrives: '6',
        driveCapacity: '4000',
        raidType: 'raid6',
        primaryUse: 'media',
        numUsers: '8',
        cpuCores: '6',
        osType: 'unraid',
        priority: 'performance',
        networkSpeed: '2.5',
        internetConnected: 'yes',
        remoteAccess: 'tunnel',
        botProtection: 'advanced',
        ddrType: 'ddr4'
    },
    vm: {
        nasModel: 'VM Host',
        currentRAM: '16',
        maxRAM: '64',
        numDrives: '4',
        driveCapacity: '2000',
        raidType: 'raid10',
        primaryUse: 'vm',
        numUsers: '1',
        cpuCores: '12',
        osType: 'truenas',
        priority: 'performance',
        networkSpeed: '10',
        internetConnected: 'yes',
        remoteAccess: 'tunnel',
        botProtection: 'advanced',
        ddrType: 'ddr5'
    },
    enterprise: {
        nasModel: 'Enterprise NAS',
        currentRAM: '32',
        maxRAM: '128',
        numDrives: '12',
        driveCapacity: '8000',
        raidType: 'raid6',
        primaryUse: 'database',
        numUsers: '20',
        cpuCores: '16',
        osType: 'truenas',
        priority: 'performance',
        networkSpeed: '10',
        internetConnected: 'yes',
        remoteAccess: 'tunnel',
        botProtection: 'advanced',
        ddrType: 'ddr5'
    }
};

function loadPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) {
        console.error('Preset not found:', presetName);
        return;
    }
    
    document.getElementById('nas-model').value = preset.nasModel;
    document.getElementById('current-ram').value = preset.currentRAM;
    document.getElementById('max-ram').value = preset.maxRAM;
    document.getElementById('num-drives').value = preset.numDrives;
    document.getElementById('drive-capacity').value = preset.driveCapacity;
    document.getElementById('raid-type').value = preset.raidType;
    document.getElementById('primary-use').value = preset.primaryUse;
    document.getElementById('num-users').value = preset.numUsers;
    document.getElementById('cpu-cores').value = preset.cpuCores;
    document.getElementById('os-type').value = preset.osType;
    document.getElementById('priority').value = preset.priority;
    document.getElementById('network-speed').value = preset.networkSpeed;
    document.getElementById('internet-connected').value = preset.internetConnected;
    document.getElementById('remote-access').value = preset.remoteAccess;
    document.getElementById('bot-protection').value = preset.botProtection;
    document.getElementById('ddr-type').value = preset.ddrType;
    document.getElementById('budget').value = '';
    calculateRAM();
}

// RAM pricing estimates (per GB)
const ramPrices = {
    budget: 50,
    mid: 80,
    premium: 150
};

function getRAIDUsableCapacity(total, numDrives, raidType) {
    if (numDrives === 0) return 0;
    
    const driveSize = total / numDrives;
    switch(raidType) {
        case 'raid0': return total;
        case 'raid1': return driveSize;
        case 'raid5': return driveSize * (numDrives - 1);
        case 'raid6': return driveSize * (numDrives - 2);
        case 'raid10': return (driveSize * numDrives) / 2;
        default: return total;
    }
}

function estimateRAMPrice(recommendedRAM, priority) {
    const currentRAM = parseFloat(document.getElementById('current-ram').value) || 0;
    const ramNeeded = Math.max(0, recommendedRAM - currentRAM);
    
    let pricePerGB = ramPrices.mid;
    if (priority === 'cost') pricePerGB = ramPrices.budget;
    if (priority === 'performance') pricePerGB = ramPrices.premium;
    
    return ramNeeded * pricePerGB;
}

function calculateRAM() {
    console.log('calculateRAM called');
    
    const currentRAM = parseFloat(document.getElementById('current-ram').value) || 0;
    const maxRAM = parseFloat(document.getElementById('max-ram').value) || 0;
    const numDrives = parseInt(document.getElementById('num-drives').value) || 0;
    const driveCapacity = parseInt(document.getElementById('drive-capacity').value) || 0;
    const primaryUse = document.getElementById('primary-use').value;
    const numUsers = parseInt(document.getElementById('num-users').value) || 1;
    const cpuCores = parseInt(document.getElementById('cpu-cores').value) || 2;
    const raidType = document.getElementById('raid-type').value;
    const priority = document.getElementById('priority').value || 'balanced';
    const osType = document.getElementById('os-type').value;
    const internetConnected = document.getElementById('internet-connected').value || 'yes';
    const remoteAccess = document.getElementById('remote-access').value || 'none';
    const botProtection = document.getElementById('bot-protection').value || 'none';
    const ddrType = document.getElementById('ddr-type').value || 'ddr4';

    let recommendedRAM = 8;

    // Base recommendation based on use case
    if (primaryUse === 'backup') {
        recommendedRAM = 8;
    } else if (primaryUse === 'media') {
        recommendedRAM = 16;
    } else if (primaryUse === 'vm') {
        recommendedRAM = 32;
    } else if (primaryUse === 'database') {
        recommendedRAM = 32;
    } else if (primaryUse === 'mixed') {
        recommendedRAM = 24;
    }
    
    recommendedRAM = Math.min(maxRAM, recommendedRAM);

    // Adjust for number of users
    recommendedRAM = Math.min(maxRAM, recommendedRAM + (numUsers * 2));

    // Adjust for CPU cores
    recommendedRAM = Math.min(maxRAM, recommendedRAM + (cpuCores / 2));

    // Adjust for storage size
    const totalStorage = numDrives * driveCapacity;
    if (totalStorage > 20000) {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 8);
    }

    // OS base requirement
    if (osType === 'unraid') recommendedRAM = Math.min(maxRAM, Math.max(recommendedRAM, 6));
    if (osType === 'truenas') recommendedRAM = Math.min(maxRAM, Math.max(recommendedRAM, 8));
    if (osType === 'ubuntu') recommendedRAM = Math.min(maxRAM, Math.max(recommendedRAM, 4));

    // Internet connectivity adjustment
    if (internetConnected === 'yes') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 2);
    }

    // Remote access method adjustment
    if (remoteAccess === 'port-forward') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 1);
    } else if (remoteAccess === 'tunnel') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 3);
    }

    // Bot/Malware protection adjustment
    if (botProtection === 'basic') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 1);
    } else if (botProtection === 'advanced') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM + 4);
    }

    // DDR Type adjustment (DDR5 more efficient, DDR3 less efficient)
    if (ddrType === 'ddr3') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM * 1.15);
    } else if (ddrType === 'ddr5') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM * 0.9);
    }

    // Priority adjustment
    if (priority === 'cost') {
        recommendedRAM = Math.max(8, recommendedRAM * 0.8);
    } else if (priority === 'performance') {
        recommendedRAM = Math.min(maxRAM, recommendedRAM * 1.2);
    }

    recommendedRAM = Math.min(maxRAM, recommendedRAM);

    // Determine RAM tier
    let ramTier = 'budget';
    if (recommendedRAM > 16) ramTier = 'premium';
    else if (recommendedRAM > 8) ramTier = 'mid';

    const estimatedCost = estimateRAMPrice(recommendedRAM, priority);
    const usableStorage = getRAIDUsableCapacity(totalStorage, numDrives, raidType);

    // Update hidden fields
    const recRAMField = document.getElementById('recommended-ram');
    const ramTierField = document.getElementById('ram-tier');
    
    if (recRAMField) recRAMField.value = recommendedRAM.toFixed(0);
    if (ramTierField) ramTierField.value = ramTier;

    // Generate performance notes
    let notes = [];
    if (numUsers > 10) notes.push('🔴 High user count - ensure sufficient RAM for concurrent users');
    if (primaryUse === 'vm') notes.push('🖥️ VM workload - consistent RAM allocation is critical');
    if (raidType === 'raid0') notes.push('⚠️ RAID 0 offers no redundancy - consider RAID 5/6');
    if (raidType === 'raid6') notes.push('✅ RAID 6 provides excellent protection');
    if (totalStorage > 50000) notes.push('📈 Very large storage - monitor RAM usage closely');
    if (currentRAM > recommendedRAM) notes.push('✅ Current RAM exceeds recommendation');
    if (internetConnected === 'yes') notes.push('🌐 Internet connected - overhead for remote access services');
    if (remoteAccess === 'tunnel') notes.push('🔒 Tunneling adds encryption overhead');
    if (botProtection === 'advanced') notes.push('🛡️ Advanced protection requires significant resources');
    const notesText = notes.length > 0 ? notes.join(' ') : '✅ Configuration looks good!';

    // Update recommendation card
    const recRAMBig = document.getElementById('recommended-ram-big');
    const recText = document.getElementById('recommendation-text');
    
    if (recRAMBig) recRAMBig.textContent = `${recommendedRAM.toFixed(0)}GB`;
    if (recText) {
        const upgradeMsg = recommendedRAM > currentRAM 
            ? `Upgrade by ${(recommendedRAM - currentRAM).toFixed(0)}GB`
            : 'Your RAM is sufficient';
        recText.textContent = upgradeMsg;
    }

    // Update summary cards
    const sumCurrent = document.getElementById('summary-current');
    const sumStorage = document.getElementById('summary-storage');
    const sumUsable = document.getElementById('summary-usable');
    const sumCost = document.getElementById('summary-cost');
    const sumNotes = document.getElementById('summary-notes');
    
    if (sumCurrent) sumCurrent.textContent = `${currentRAM}GB / ${maxRAM}GB`;
    if (sumStorage) sumStorage.textContent = `${totalStorage}GB`;
    if (sumUsable) sumUsable.textContent = `${usableStorage.toFixed(0)}GB`;
    if (sumCost) sumCost.textContent = `$${estimatedCost.toFixed(2)}`;
    if (sumNotes) sumNotes.textContent = notesText;

    // Update RAM visualizer
    const totalRAMNeed = recommendedRAM;
    const additionalNeeded = Math.max(0, recommendedRAM - currentRAM);
    
    if (maxRAM > 0) {
        const currentPercent = (currentRAM / maxRAM) * 100;
        const additionalPercent = (additionalNeeded / maxRAM) * 100;

        const ramUsedBar = document.getElementById('ram-used-bar');
        const ramUsedText = document.getElementById('ram-used-text');
        const ramNeededBar = document.getElementById('ram-needed-bar');
        const ramNeededText = document.getElementById('ram-needed-text');
        const ramMaxDisplay = document.getElementById('ram-max-display');
        const ramTotalDisplay = document.getElementById('ram-total-display');
        
        if (ramUsedBar) ramUsedBar.style.width = Math.min(100, currentPercent) + '%';
        if (ramUsedText) ramUsedText.textContent = `${currentRAM}GB`;
        
        if (ramNeededBar) ramNeededBar.style.width = Math.min(100, additionalPercent) + '%';
        if (ramNeededText) ramNeededText.textContent = additionalNeeded > 0 ? `+${additionalNeeded.toFixed(0)}GB` : '';
        
        if (ramMaxDisplay) ramMaxDisplay.textContent = `${maxRAM}GB`;
        if (ramTotalDisplay) ramTotalDisplay.textContent = `${totalRAMNeed.toFixed(0)}GB`;
    }
    
    console.log('Recommended RAM:', recommendedRAM, 'GB');
}

function saveConfiguration() {
    const config = {
        nasModel: document.getElementById('nas-model').value,
        currentRAM: document.getElementById('current-ram').value,
        maxRAM: document.getElementById('max-ram').value,
        numDrives: document.getElementById('num-drives').value,
        driveCapacity: document.getElementById('drive-capacity').value,
        raidType: document.getElementById('raid-type').value,
        primaryUse: document.getElementById('primary-use').value,
        numUsers: document.getElementById('num-users').value,
        cpuCores: document.getElementById('cpu-cores').value,
        networkSpeed: document.getElementById('network-speed').value,
        osType: document.getElementById('os-type').value,
        internetConnected: document.getElementById('internet-connected').value,
        remoteAccess: document.getElementById('remote-access').value,
        botProtection: document.getElementById('bot-protection').value,
        ddrType: document.getElementById('ddr-type').value,
        recommendedRAM: document.getElementById('recommended-ram').value,
        timestamp: new Date().toLocaleString()
    };

    let configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    configs.push(config);
    localStorage.setItem('nasConfigs', JSON.stringify(configs));
    
    displaySavedConfigs();
    alert('Configuration saved!');
}

function loadConfiguration() {
    const configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    if (configs.length === 0) {
        alert('No saved configurations found');
        return;
    }

    const config = configs[configs.length - 1];
    document.getElementById('nas-model').value = config.nasModel;
    document.getElementById('current-ram').value = config.currentRAM;
    document.getElementById('max-ram').value = config.maxRAM;
    document.getElementById('num-drives').value = config.numDrives;
    document.getElementById('drive-capacity').value = config.driveCapacity;
    document.getElementById('raid-type').value = config.raidType;
    document.getElementById('primary-use').value = config.primaryUse;
    document.getElementById('num-users').value = config.numUsers;
    document.getElementById('cpu-cores').value = config.cpuCores;
    document.getElementById('network-speed').value = config.networkSpeed;
    document.getElementById('os-type').value = config.osType;
    document.getElementById('internet-connected').value = config.internetConnected || 'yes';
    document.getElementById('remote-access').value = config.remoteAccess || 'none';
    document.getElementById('bot-protection').value = config.botProtection || 'none';
    document.getElementById('ddr-type').value = config.ddrType || 'ddr4';
    
    calculateRAM();
}

function displaySavedConfigs() {
    const configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    const container = document.getElementById('saved-configs');
    
    if (configs.length === 0) {
        container.innerHTML = '<p>No saved configurations</p>';
        return;
    }

    let html = '<p>Latest Configs:</p><ul>';
    configs.slice(-3).forEach((config, idx) => {
        html += `<li>${config.nasModel || 'Unknown'} - ${config.recommendedRAM}GB RAM - ${config.timestamp}</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}

function resetForm() {
    document.getElementById('nas-model').value = '';
    document.getElementById('current-ram').value = '';
    document.getElementById('max-ram').value = '';
    document.getElementById('num-drives').value = '';
    document.getElementById('drive-capacity').value = '';
    document.getElementById('raid-type').value = '';
    document.getElementById('primary-use').value = '';
    document.getElementById('num-users').value = '';
    document.getElementById('cpu-cores').value = '';
    document.getElementById('network-speed').value = '';
    document.getElementById('os-type').value = '';
    document.getElementById('budget').value = '';
    document.getElementById('priority').value = 'balanced';
    document.getElementById('internet-connected').value = 'yes';
    document.getElementById('remote-access').value = 'none';
    document.getElementById('bot-protection').value = 'none';
    document.getElementById('ddr-type').value = 'ddr4';
    document.getElementById('recommended-ram').value = '';
    document.getElementById('ram-tier').value = '';
    document.getElementById('summary-current').textContent = '';
    document.getElementById('summary-storage').textContent = '';
    document.getElementById('summary-usable').textContent = '';
    document.getElementById('summary-cost').textContent = '';
    document.getElementById('summary-notes').textContent = '';
    document.getElementById('recommended-ram-big').textContent = '0GB';
    document.getElementById('recommendation-text').textContent = 'Enter values to see recommendation';
}

// Load saved configs on page load
window.addEventListener('load', function() {
    displaySavedConfigs();
    console.log('Page loaded - app.js initialized');
});
