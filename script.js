// Format capacity
function formatCapacity(gb) {
    const numGb = parseFloat(gb);
    if (numGb >= 1000) {
        return (numGb / 1024).toFixed(1) + 'TB';
    }
    return Math.round(numGb) + 'GB';
}

// Presets
const presets = {
    home: {
        nasModel: 'Home NAS',
        currentRAM: '4',
        maxRAM: '16',
        numDrives: '2',
        driveCapacity: '2000',
        raidType: 'raid1',
        primaryUse: 'backup',
        numUsers: '3',
        cpuCores: '4',
        osType: 'synology',
        priority: 'balanced',
        networkSpeed: '1',
        internetConnected: 'no',
        remoteAccess: 'port-forward',
        botProtection: 'basic',
        ddrType: 'ddr4'
    },
    media: {
        nasModel: 'Media Server',
        currentRAM: '8',
        maxRAM: '32',
        numDrives: '4',
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

// RAM prices
const ramPrices = {
    ddr3: 40,
    ddr4: 60,
    ddr5: 100
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

function estimateRAMPrice(recommendedRAM, ddrType) {
    const currentRAM = parseFloat(document.getElementById('current-ram').value) || 0;
    const ramNeeded = Math.max(0, recommendedRAM - currentRAM);
    const pricePerSixteenGB = ramPrices[ddrType] || ramPrices.ddr4;
    const cost = (ramNeeded / 16) * pricePerSixteenGB;
    return cost;
}

function calculateRAM() {
    console.log('calculateRAM called');
    const currentRAM = parseFloat(document.getElementById('current-ram').value) || 0;
    const maxRAM = parseFloat(document.getElementById('max-ram').value) || 0;
    const numDrives = parseInt(document.getElementById('num-drives').value) || 0;
    const driveCapacity = parseInt(document.getElementById('drive-capacity').value) || 0;
    const primaryUse = document.getElementById('primary-use').value;
    const numUsers = parseInt(document.getElementById('num-users').value) || 1;
    const raidType = document.getElementById('raid-type').value;
    const osType = document.getElementById('os-type').value;
    const internetConnected = document.getElementById('internet-connected').value || 'yes';
    const remoteAccess = document.getElementById('remote-access').value || 'none';
    const botProtection = document.getElementById('bot-protection').value || 'none';
    const ddrType = document.getElementById('ddr-type').value || 'ddr4';

    let total = 0;

    // Base OS
    let baseOS = 2.5;
    switch(osType) {
        case 'synology': baseOS = 2.5; break;
        case 'openmediavault': baseOS = 2; break;
        case 'unraid': baseOS = 3; break;
        case 'truenas': baseOS = 6; break;
        case 'ubuntu': baseOS = 2; break;
        case 'custom': baseOS = 2; break;
        default: baseOS = 2.5;
    }
    total += baseOS;

    // Storage overhead
    let storageOverhead = numDrives * 0.4;
    switch(raidType) {
        case 'raid1': storageOverhead += 0.5; break;
        case 'raid5': storageOverhead += 1; break;
        case 'raid6': storageOverhead += 1.5; break;
        case 'raid10': storageOverhead += 1; break;
        default: break;
    }
    const totalStorage = numDrives * driveCapacity;
    const usableStorage = getRAIDUsableCapacity(totalStorage, numDrives, raidType);
    if (usableStorage > 20000) {
        const excessTB = Math.floor((usableStorage - 20000) / 1000);
        storageOverhead += Math.ceil(excessTB / 10);
    }
    total += storageOverhead;

    // Workload
    let workloadRAM = 0;
    let vmExtra = 0; // VM overhead GB
    switch(primaryUse) {
        case 'backup': workloadRAM = 1; break;
        case 'media': workloadRAM = 2; break;
        case 'database': workloadRAM = 2; break;
        case 'vm': workloadRAM = 2; vmExtra = 10; break;
        case 'mixed': workloadRAM = 2; break;
        default: workloadRAM = 1;
    }
    total += workloadRAM;
    // Apply VM overhead
    if (vmExtra > 0) total += vmExtra;

    // Users
    let userRAM = numUsers * 0.25; // per-user, no cap
    total += userRAM;

    // Security
    let securityRAM = 0;
    if (internetConnected === 'yes') securityRAM += 0.5;
    if (remoteAccess === 'port-forward') securityRAM += 0.5;
    else if (remoteAccess === 'tunnel') securityRAM += 0.5;
    if (botProtection === 'basic') securityRAM += 0.5;
    else if (botProtection === 'advanced') securityRAM += 1;
    total += securityRAM;

    // Tiers
    const tiers = [1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 56, 64, 70, 80, 90, 120, 128, 256, 512, 1024];

    // Min Safe
    let minSafeRAM = tiers[0];
    for (let tier of tiers) {
        if (total <= tier) {
            minSafeRAM = tier;
            break;
        }
    }
    minSafeRAM = Math.min(maxRAM, minSafeRAM);

    // Recommended
    let rawTotal = total;
    let recommendedTotal = total * 1.15;
    if ((recommendedTotal - rawTotal) < 1) {
        recommendedTotal = rawTotal + 1;
    }
    let recommendedRAM = tiers[0];
    let exceedsCPU = false;
    for (let tier of tiers) {
        if (recommendedTotal <= tier) {
            recommendedRAM = tier;
            break;
        }
    }
    if (recommendedTotal > 128) {
        exceedsCPU = true;
    }
    recommendedRAM = Math.min(maxRAM, recommendedRAM);

    // For Growth
    let growthTotal = recommendedTotal * 1.3;
    let growthRAM = tiers[0];
    for (let tier of tiers) {
        if (growthTotal <= tier) {
            growthRAM = tier;
            break;
        }
    }
    growthRAM = Math.min(maxRAM, growthRAM);

    const estimatedCost = estimateRAMPrice(recommendedRAM, ddrType);
    const recRAMField = document.getElementById('recommended-ram');
    const ramTierField = document.getElementById('ram-tier');

    if (recRAMField) recRAMField.value = recommendedRAM.toFixed(0);
    if (ramTierField) ramTierField.value = recommendedRAM > 32 ? 'premium' : (recommendedRAM > 8 ? 'mid' : 'budget');

    // Notes
    let notes = [];
    if (exceedsCPU) notes.push('More RAM needed than CPU can handle');
    if (numUsers > 10) notes.push('High concurrent users: verify this count is accurate');
    if (primaryUse === 'vm') notes.push('VM host: +10GB VM overhead applied for guest allocations');
    if (raidType === 'raid0') notes.push('RAID 0 has no redundancy: data loss if any drive fails');
    if (primaryUse === 'media' && remoteAccess === 'tunnel') notes.push('Transcoding over VPN will be slower: consider balanced priority');
    if (usableStorage > 50000) notes.push('Very large storage: monitor pool health regularly');
    if (botProtection === 'advanced' && primaryUse === 'backup') notes.push('Advanced scanning may be overkill for pure backup storage');
    const notesText = notes.length > 0 ? notes.join('<br>') : 'Configuration is conservative and well-balanced.';

    // Update recommendation
    const recRAMBig = document.getElementById('recommended-ram-big');
    const recText = document.getElementById('recommendation-text');
    if (recRAMBig) {
        if (exceedsCPU) {
            recRAMBig.textContent = '>128GB';
        } else {
            recRAMBig.textContent = formatCapacity(recommendedRAM);
        }
    }
    if (recText) {
        if (exceedsCPU) {
            recText.textContent = 'Exceeds typical NAS capacity';
        } else {
            const upgradeMsg = recommendedRAM > currentRAM
                ? `Upgrade by ${recommendedRAM - currentRAM}GB`
                : 'Your current RAM is sufficient';
            recText.textContent = upgradeMsg;
        }
    }

    // Update summary
    const sumCurrent = document.getElementById('summary-current');
    const sumStorage = document.getElementById('summary-storage');
    const sumUsable = document.getElementById('summary-usable');
    const sumCost = document.getElementById('summary-cost');
    const sumNotes = document.getElementById('summary-notes');
    if (sumCurrent) sumCurrent.textContent = `${currentRAM}GB / ${maxRAM}GB`;
    if (sumStorage) sumStorage.textContent = formatCapacity(totalStorage);
    if (sumUsable) sumUsable.textContent = formatCapacity(usableStorage);
    if (sumCost) sumCost.textContent = `$${estimatedCost.toFixed(2)}`;
    if (sumNotes) sumNotes.innerHTML = notesText;

    // Visualizer
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
        if (ramUsedText) ramUsedText.textContent = formatCapacity(currentRAM);
        if (ramNeededBar) ramNeededBar.style.width = Math.min(100, additionalPercent) + '%';
        if (ramNeededText) ramNeededText.textContent = additionalNeeded > 0 ? `+${additionalNeeded}GB` : '';
        if (ramMaxDisplay) ramMaxDisplay.textContent = formatCapacity(maxRAM);
        if (ramTotalDisplay) ramTotalDisplay.textContent = formatCapacity(recommendedRAM);
    }

    // Show tiers
    const tierDisplay = document.getElementById('tier-display');
    if (tierDisplay) {
        tierDisplay.innerHTML = `
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
                <div style="flex: 1; padding: 8px; border: 1px solid #475569; text-align: center; font-size: 0.85em;">
                    <div style="color: #94a3b8; margin-bottom: 2px;">Minimum Safe</div>
                    <div style="font-weight: bold;">${formatCapacity(minSafeRAM)}</div>
                </div>
                <div style="flex: 1; padding: 8px; border: 1px solid #475569; text-align: center; font-size: 0.85em;">
                    <div style="color: #94a3b8; margin-bottom: 2px;">For Growth</div>
                    <div style="font-weight: bold;">${formatCapacity(growthRAM)}</div>
                </div>
            </div>
        `;
    }
    console.log('Conservative calculation - Recommended RAM:', recommendedRAM, 'GB');
}

function saveConfiguration() {
    const recommendedText = document.getElementById('recommended-ram-big').textContent;
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
        recommendedRAM: recommendedText,
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

function clearOldConfigs() {
    const configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    if (configs.length === 0) {
        alert('No saved configurations to delete');
        return;
    }
    if (confirm(`Delete all ${configs.length} saved configurations?`)) {
        localStorage.setItem('nasConfigs', JSON.stringify([]));
        displaySavedConfigs();
        alert('All saved configurations deleted!');
    }
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

// Init on load
window.addEventListener('load', function() {
    displaySavedConfigs();
    console.log('Page loaded - script.js initialized');
    initializeTutorial();
});

// Tutorial
let currentTutorialStep = 0;

const tutorialSteps = [
    {
        title: 'Welcome',
        text: 'This tool calculates your optimal NAS RAM configuration.',
        highlight: 'Click any preset or enter your own values to get started'
    },
    {
        title: 'Fill Your Setup',
        text: 'Enter your hardware specs, storage, and workload details.',
        highlight: 'Everything calculates in real-time as you type'
    },
    {
        title: 'View Results',
        text: 'Your RAM recommendation appears at the top along with cost and storage details.',
        highlight: 'Save configurations for future reference'
    }
];

function initializeTutorial() {
    // Check tutorial seen
    if (!localStorage.getItem('tutorialComplete')) {
        showTutorial();
    } else {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

function showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        currentTutorialStep = 0;
        updateTutorialStep();
    }
}

function updateTutorialStep() {
    const step = tutorialSteps[currentTutorialStep];
    
    // Update tutorial content
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').textContent = step.text;
    document.getElementById('tutorial-highlight').textContent = step.highlight;
    
    // Tutorial dots
    const dotsContainer = document.getElementById('tutorial-dots');
    dotsContainer.innerHTML = '';
    tutorialSteps.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = 'tutorial-dot' + (idx === currentTutorialStep ? ' active' : '');
        dotsContainer.appendChild(dot);
    });
    
    // Button text
    const nextBtn = document.querySelector('.tutorial-btn-primary');
    if (nextBtn) {
        nextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1 ? 'Got it!' : 'Next';
    }
}

function nextTutorialStep() {
    currentTutorialStep++;
    
    if (currentTutorialStep >= tutorialSteps.length) {
        closeTutorial();
    } else {
        updateTutorialStep();
    }
}

function closeTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        localStorage.setItem('tutorialComplete', 'true');
    }
}

// RAID Info Popup Functions
function showRAIDInfo() {
    const popup = document.getElementById('raid-popup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

function hideRAIDInfo() {
    const popup = document.getElementById('raid-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const raidPopup = document.getElementById('raid-popup');
    if (raidPopup) {
        raidPopup.addEventListener('click', function(event) {
            if (event.target === this) {
                hideRAIDInfo();
            }
        });
    }
});

// Compare Configs
function openCompareMode() {
    const configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    if (configs.length < 2) {
        alert('Need at least 2 saved configurations to compare');
        return;
    }
    
    const modal = document.getElementById('compare-modal');
    const body = document.getElementById('compare-body');
    
    let html = '<div style="margin-bottom: 20px;">';
    html += '<label style="display: block; margin-bottom: 12px; color: #cbd5e1;"><strong>Select 2-4 configs to compare:</strong></label>';
    html += '<div style="margin-bottom: 20px;">';
    
    configs.forEach((config, idx) => {
        html += `<div style="margin-bottom: 8px;">`;
        html += `<input type="checkbox" class="compare-checkbox" value="${idx}" id="cfg-${idx}" style="cursor: pointer;">`;
        html += `<label for="cfg-${idx}" style="cursor: pointer; color: #cbd5e1;">${config.nasModel || 'Config ' + (idx+1)} - ${config.recommendedRAM} RAM - ${config.timestamp}</label>`;
        html += `</div>`;
    });
    
    html += '</div>';
    html += '<div class="compare-button-group">';
    html += '<button onclick="generateComparison()">Compare Selected</button>';
    html += '<button onclick="closeCompareMode()">Cancel</button>';
    html += '</div>';
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function closeCompareMode() {
    const modal = document.getElementById('compare-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function generateComparison() {
    const checkboxes = document.querySelectorAll('.compare-checkbox:checked');
    if (checkboxes.length < 2 || checkboxes.length > 4) {
        alert('Select 2-4 configurations to compare');
        return;
    }
    
    const configs = JSON.parse(localStorage.getItem('nasConfigs')) || [];
    const selected = Array.from(checkboxes).map(cb => configs[parseInt(cb.value)]);
    
    const fields = ['nasModel', 'currentRAM', 'maxRAM', 'numDrives', 'driveCapacity', 'raidType', 'primaryUse', 'numUsers', 'cpuCores', 'osType', 'recommendedRAM', 'timestamp'];
    
    let html = '<table class="compare-table"><tr><th>Property</th>';
    selected.forEach((_, i) => {
        html += `<th>Config ${i+1}</th>`;
    });
    html += '</tr>';
    
    const labels = {
        nasModel: 'NAS Model',
        currentRAM: 'Current RAM (GB)',
        maxRAM: 'Max RAM (GB)',
        numDrives: 'Drives',
        driveCapacity: 'Drive Size (GB)',
        raidType: 'RAID Type',
        primaryUse: 'Primary Use',
        numUsers: 'Concurrent Users',
        cpuCores: 'CPU Cores',
        osType: 'OS Type',
        recommendedRAM: 'Recommended RAM',
        timestamp: 'Saved'
    };
    
    fields.forEach(field => {
        html += '<tr><td><strong>' + labels[field] + '</strong></td>';
        selected.forEach(config => {
            html += `<td>${config[field] || '-'}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</table>';
    html += '<div class="compare-button-group">';
    html += '<button onclick="closeCompareMode()">Close</button>';
    html += '</div>';
    
    document.getElementById('compare-body').innerHTML = html;
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('compare-modal');
    if (event.target === modal) {
        closeCompareMode();
    }
});
