// Function to show different pages
function showPage(pageId) {
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to the nav link that corresponds to this page
    navLinks.forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageId)) {
            link.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// Manufacturing Simulation
// ========================================

let simulation = {
    running: false,

    // Control settings
    controls: {
        rawMaterialRate: 5,      // units per second (increased for better flow)
        metalShopSpeed: 100,     // percentage
        woodShopSpeed: 100,      // percentage
        assemblySpeed: 100,      // percentage
        qualityLevel: 2,         // 1=Fast, 2=Standard, 3=Premium
        maintenanceMode: false   // true = maintenance (slower but better quality)
    },

    // Base production rates (units per second, modified by controls)
    baseRates: {
        rawMaterial: 3,
        bolt: 2,
        rod: 2,
        leg: 0.5,
        seat: 0.5,
        back: 0.5,
        assembly: 0.3,
        qc: 1.0
    },

    // Inventory/buffers
    inventory: {
        steel: 0,
        wood: 0,
        bolts: 0,
        rods: 0,
        legs: 0,
        seats: 0,
        backs: 0,
        assembled: 0
    },

    // Production counters
    produced: {
        rawMaterial: 0,
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0,
        qc: 0,
        final: 0
    },

    // Time tracking
    lastUpdate: Date.now(),
    totalTime: 0,

    // Accumulator for partial production
    accumulator: {
        rawMaterial: 0,
        rawWood: 0,
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0,
        qc: 0
    },

    // Quality tracking
    defectRate: 0.05, // 5% base defect rate
    rejected: 0,

    // Overflow tracking
    overflowAlertShown: false
};

// Initialize simulation when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Digital Twins website loaded successfully!');
    
    // Set up rate controls
    setupRateControls();
    
    // Start simulation
    startSimulation();
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSimulation);
    }
});

function setupRateControls() {
    // Raw Material control
    const rawMaterialSlider = document.getElementById('raw-material-rate');
    if (rawMaterialSlider) {
        rawMaterialSlider.addEventListener('input', function() {
            simulation.controls.rawMaterialRate = parseFloat(this.value);
            document.getElementById('rate-raw').textContent = this.value;
        });
    }

    // Metal Shop Speed control
    const metalShopSlider = document.getElementById('metal-shop-rate');
    if (metalShopSlider) {
        metalShopSlider.addEventListener('input', function() {
            simulation.controls.metalShopSpeed = parseInt(this.value);
            document.getElementById('rate-metal').textContent = this.value;
        });
    }

    // Wood Shop Speed control
    const woodShopSlider = document.getElementById('wood-shop-rate');
    if (woodShopSlider) {
        woodShopSlider.addEventListener('input', function() {
            simulation.controls.woodShopSpeed = parseInt(this.value);
            document.getElementById('rate-wood').textContent = this.value;
        });
    }

    // Assembly Speed control
    const assemblySlider = document.getElementById('assembly-rate');
    if (assemblySlider) {
        assemblySlider.addEventListener('input', function() {
            simulation.controls.assemblySpeed = parseInt(this.value);
            document.getElementById('rate-assembly').textContent = this.value;
        });
    }

    // Quality Control level
    const qualitySlider = document.getElementById('quality-control');
    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            simulation.controls.qualityLevel = parseInt(this.value);
            const levels = ['', 'Fast', 'Standard', 'Premium'];
            document.getElementById('quality-level').textContent = levels[this.value];

            // Adjust defect rate based on quality level
            if (this.value === 1) {
                simulation.defectRate = 0.15; // 15% defects on fast
            } else if (this.value === 2) {
                simulation.defectRate = 0.05; // 5% defects on standard
            } else {
                simulation.defectRate = 0.01; // 1% defects on premium
            }
        });
    }

    // Maintenance Mode toggle
    const maintenanceToggle = document.getElementById('maintenance-toggle');
    if (maintenanceToggle) {
        maintenanceToggle.addEventListener('input', function() {
            simulation.controls.maintenanceMode = this.value === '1';
            document.getElementById('maintenance-mode').textContent =
                simulation.controls.maintenanceMode ? 'Maintenance' : 'Normal';
        });
    }
}

function startSimulation() {
    simulation.running = true;
    simulation.lastUpdate = Date.now();
    updateSimulation();
}

function getEffectiveRate(baseName, speedMultiplier = 100) {
    let rate = simulation.baseRates[baseName];

    // Apply speed multiplier (percentage)
    rate *= (speedMultiplier / 100);

    // Apply maintenance mode (50% slower, better quality)
    if (simulation.controls.maintenanceMode) {
        rate *= 0.5;
        simulation.defectRate = Math.max(0.01, simulation.defectRate * 0.3);
    }

    // Quality level affects speed
    if (simulation.controls.qualityLevel === 1) {
        rate *= 1.2; // Fast mode: 20% faster
    } else if (simulation.controls.qualityLevel === 3) {
        rate *= 0.8; // Premium mode: 20% slower
    }

    return rate;
}

function updateSimulation() {
    if (!simulation.running) return;

    const now = Date.now();
    const deltaTime = (now - simulation.lastUpdate) / 1000; // Convert to seconds
    simulation.lastUpdate = now;
    simulation.totalTime += deltaTime;

    // Stage 1: Raw Material Supply - produces steel and wood
    const rawRate = simulation.controls.rawMaterialRate;
    const steelRate = rawRate * 0.7;  // 70% goes to steel (increased for metal shop)
    const woodRate = rawRate * 0.3;   // 30% goes to wood

    // Accumulate steel separately
    simulation.accumulator.rawMaterial += steelRate * deltaTime;
    if (simulation.accumulator.rawMaterial >= 1) {
        const steelProduced = Math.floor(simulation.accumulator.rawMaterial);
        simulation.inventory.steel += steelProduced;
        simulation.accumulator.rawMaterial -= steelProduced;
    }

    // Accumulate wood separately (reuse machine1 accumulator slot for wood)
    if (!simulation.accumulator.rawWood) simulation.accumulator.rawWood = 0;
    simulation.accumulator.rawWood += woodRate * deltaTime;
    if (simulation.accumulator.rawWood >= 1) {
        const woodProduced = Math.floor(simulation.accumulator.rawWood);
        simulation.inventory.wood += woodProduced;
        simulation.accumulator.rawWood -= woodProduced;
    }

    simulation.produced.rawMaterial += rawRate * deltaTime;

    // Stage 2: Metal Shop - Machine 1 (Bolts)
    const boltRate = getEffectiveRate('bolt', simulation.controls.metalShopSpeed);
    simulation.accumulator.machine1 += boltRate * deltaTime;
    if (simulation.accumulator.machine1 >= 1 && simulation.inventory.steel >= 1) {
        const boltsWanted = Math.floor(simulation.accumulator.machine1);
        const boltsMade = Math.min(boltsWanted, simulation.inventory.steel);
        simulation.inventory.steel -= boltsMade;
        simulation.inventory.bolts += boltsMade;
        simulation.produced.machine1 += boltsMade;
        simulation.accumulator.machine1 -= boltsMade;
        updateMachineStatus('status1', 'Running', 'running');
    } else if (simulation.inventory.steel < 1) {
        updateMachineStatus('status1', 'Waiting', 'waiting');
    }

    // Stage 2: Metal Shop - Machine 2 (Rods)
    const rodRate = getEffectiveRate('rod', simulation.controls.metalShopSpeed);
    simulation.accumulator.machine2 += rodRate * deltaTime;
    if (simulation.accumulator.machine2 >= 1 && simulation.inventory.steel >= 1) {
        const rodsWanted = Math.floor(simulation.accumulator.machine2);
        const rodsMade = Math.min(rodsWanted, simulation.inventory.steel);
        simulation.inventory.steel -= rodsMade;
        simulation.inventory.rods += rodsMade;
        simulation.produced.machine2 += rodsMade;
        simulation.accumulator.machine2 -= rodsMade;
        updateMachineStatus('status2', 'Running', 'running');
    } else if (simulation.inventory.steel < 1) {
        updateMachineStatus('status2', 'Waiting', 'waiting');
    }

    // Stage 3: Machine 3 (Leg Assembly) - needs 8 bolts + 4 rods
    const legRate = getEffectiveRate('leg', simulation.controls.metalShopSpeed);
    simulation.accumulator.machine3 += legRate * deltaTime;
    if (simulation.accumulator.machine3 >= 1) {
        const legsWanted = Math.floor(simulation.accumulator.machine3);
        const legsCanMake = Math.min(
            legsWanted,
            Math.floor(simulation.inventory.bolts / 8),
            Math.floor(simulation.inventory.rods / 4)
        );

        if (legsCanMake > 0) {
            simulation.inventory.bolts -= legsCanMake * 8;
            simulation.inventory.rods -= legsCanMake * 4;
            simulation.inventory.legs += legsCanMake;
            simulation.produced.machine3 += legsCanMake;
            simulation.accumulator.machine3 -= legsCanMake;
            updateMachineStatus('status3', 'Running', 'running');
        } else {
            updateMachineStatus('status3', 'Waiting', 'waiting');
        }
    }

    // Stage 4: Wood Shop - Machine 4 (Seats)
    const seatRate = getEffectiveRate('seat', simulation.controls.woodShopSpeed);
    simulation.accumulator.machine4 += seatRate * deltaTime;
    if (simulation.accumulator.machine4 >= 1 && simulation.inventory.wood >= 2) {
        const seatsWanted = Math.floor(simulation.accumulator.machine4);
        const seatsMade = Math.min(seatsWanted, Math.floor(simulation.inventory.wood / 2));
        simulation.inventory.wood -= seatsMade * 2;
        simulation.inventory.seats += seatsMade;
        simulation.produced.machine4 += seatsMade;
        simulation.accumulator.machine4 -= seatsMade;
        updateMachineStatus('status4', 'Running', 'running');
    } else if (simulation.inventory.wood < 2) {
        updateMachineStatus('status4', 'Waiting', 'waiting');
    }

    // Stage 4: Wood Shop - Machine 5 (Backs)
    const backRate = getEffectiveRate('back', simulation.controls.woodShopSpeed);
    simulation.accumulator.machine5 += backRate * deltaTime;
    if (simulation.accumulator.machine5 >= 1 && simulation.inventory.wood >= 2) {
        const backsWanted = Math.floor(simulation.accumulator.machine5);
        const backsMade = Math.min(backsWanted, Math.floor(simulation.inventory.wood / 2));
        simulation.inventory.wood -= backsMade * 2;
        simulation.inventory.backs += backsMade;
        simulation.produced.machine5 += backsMade;
        simulation.accumulator.machine5 -= backsMade;
        updateMachineStatus('status5', 'Running', 'running');
    } else if (simulation.inventory.wood < 2) {
        updateMachineStatus('status5', 'Waiting', 'waiting');
    }

    // Stage 5: Machine 6 (Chair Assembly) - needs 4 legs + 1 seat + 1 back
    const assemblyRate = getEffectiveRate('assembly', simulation.controls.assemblySpeed);
    simulation.accumulator.machine6 += assemblyRate * deltaTime;
    if (simulation.accumulator.machine6 >= 1) {
        const chairsWanted = Math.floor(simulation.accumulator.machine6);
        const chairsCanMake = Math.min(
            chairsWanted,
            Math.floor(simulation.inventory.legs / 4),
            simulation.inventory.seats,
            simulation.inventory.backs
        );

        if (chairsCanMake > 0) {
            simulation.inventory.legs -= chairsCanMake * 4;
            simulation.inventory.seats -= chairsCanMake;
            simulation.inventory.backs -= chairsCanMake;
            simulation.inventory.assembled += chairsCanMake;
            simulation.produced.machine6 += chairsCanMake;
            simulation.accumulator.machine6 -= chairsCanMake;
            updateMachineStatus('status6', 'Running', 'running');
        } else {
            updateMachineStatus('status6', 'Waiting', 'waiting');
        }
    }

    // Stage 6: Quality Control
    const qcRate = getEffectiveRate('qc', 100);
    simulation.accumulator.qc += qcRate * deltaTime;
    if (simulation.accumulator.qc >= 1 && simulation.inventory.assembled > 0) {
        const qcWanted = Math.floor(simulation.accumulator.qc);
        const qcProcessed = Math.min(qcWanted, simulation.inventory.assembled);

        simulation.inventory.assembled -= qcProcessed;

        // Apply defect rate
        const passed = Math.floor(qcProcessed * (1 - simulation.defectRate));
        const failed = qcProcessed - passed;

        simulation.produced.qc += qcProcessed;
        simulation.produced.final += passed;
        simulation.rejected += failed;
        simulation.accumulator.qc -= qcProcessed;
        updateMachineStatus('status-qc', 'Inspecting', 'running');
    } else if (simulation.inventory.assembled === 0) {
        updateMachineStatus('status-qc', 'Waiting', 'waiting');
    }

    // Update display
    updateDisplay();

    // Check for inventory overflow
    checkInventoryOverflow();

    // Continue simulation
    requestAnimationFrame(updateSimulation);
}

function updateDisplay() {
    // Update production counts
    updateElement('count-raw', Math.floor(simulation.produced.rawMaterial));
    updateElement('count1', simulation.produced.machine1);
    updateElement('count2', simulation.produced.machine2);
    updateElement('count3', simulation.produced.machine3);
    updateElement('count4', simulation.produced.machine4);
    updateElement('count5', simulation.produced.machine5);
    updateElement('count6', simulation.produced.machine6);
    updateElement('count-qc', simulation.produced.qc);

    // Update inventory buffers
    updateInventoryDisplay('steel-inventory', simulation.inventory.steel);
    updateInventoryDisplay('wood-inventory', simulation.inventory.wood);
    updateInventoryDisplay('bolt-inventory', simulation.inventory.bolts);
    updateInventoryDisplay('rod-inventory', simulation.inventory.rods);
    updateInventoryDisplay('leg-inventory', simulation.inventory.legs);
    updateInventoryDisplay('seat-inventory', simulation.inventory.seats);
    updateInventoryDisplay('back-inventory', simulation.inventory.backs);
    updateInventoryDisplay('assembled-inventory', simulation.inventory.assembled);
    updateInventoryDisplay('final-chairs', simulation.produced.final);

    // Update statistics
    updateElement('chairs-produced', simulation.produced.final);

    const productionRate = simulation.totalTime > 0
        ? (simulation.produced.final / simulation.totalTime * 60).toFixed(1)
        : '0.0';
    updateElement('production-rate', productionRate + ' /min');

    // Calculate efficiency - now based on bottleneck utilization
    // Find the actual bottleneck and calculate efficiency based on it
    let efficiency = 100;

    if (simulation.totalTime > 0) {
        // Calculate theoretical maximum based on the bottleneck
        // The bottleneck is the slowest stage in the production line
        const rawRate = simulation.controls.rawMaterialRate;
        const metalRate = getEffectiveRate('bolt', simulation.controls.metalShopSpeed);
        const woodRate = getEffectiveRate('seat', simulation.controls.woodShopSpeed);
        const assemblyRate = getEffectiveRate('assembly', simulation.controls.assemblySpeed);
        const qcRate = getEffectiveRate('qc', 100);

        // Calculate maximum chairs possible based on each stage
        // Raw materials produce steel (60%) and wood (40%)
        const steelFromRaw = rawRate * 0.6;
        const woodFromRaw = rawRate * 0.4;

        // Steel makes bolts and rods (need 8 bolts + 4 rods per leg)
        // Each bolt and rod needs 1 steel
        const legsFromMetal = Math.min(metalRate / 8, metalRate / 4); // Limited by bolt or rod production

        // Wood makes seats and backs (need 2 wood each)
        const seatsFromWood = woodRate / 2;
        const backsFromWood = woodRate / 2;

        // Assembly needs 4 legs, 1 seat, 1 back
        const chairsFromLegs = legsFromMetal / 4;
        const chairsFromSeats = seatsFromWood;
        const chairsFromBacks = backsFromWood;

        // Theoretical maximum is the bottleneck
        const theoreticalMax = Math.min(
            chairsFromLegs,
            chairsFromSeats,
            chairsFromBacks,
            assemblyRate,
            qcRate
        ) * simulation.totalTime * (1 - simulation.defectRate);

        // Efficiency is actual production vs theoretical maximum
        efficiency = theoreticalMax > 0
            ? Math.min(100, (simulation.produced.final / theoreticalMax * 100)).toFixed(0)
            : 100;
    }

    updateElement('efficiency', efficiency + '%');
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function checkInventoryOverflow() {
    const overflowLimit = 300;
    let overflowItems = [];

    if (simulation.inventory.steel > overflowLimit) {
        overflowItems.push('Steel: ' + simulation.inventory.steel);
    }
    if (simulation.inventory.wood > overflowLimit) {
        overflowItems.push('Wood: ' + simulation.inventory.wood);
    }
    if (simulation.inventory.bolts > overflowLimit) {
        overflowItems.push('Bolts: ' + simulation.inventory.bolts);
    }
    if (simulation.inventory.rods > overflowLimit) {
        overflowItems.push('Rods: ' + simulation.inventory.rods);
    }
    if (simulation.inventory.legs > overflowLimit) {
        overflowItems.push('Legs: ' + simulation.inventory.legs);
    }
    if (simulation.inventory.seats > overflowLimit) {
        overflowItems.push('Seats: ' + simulation.inventory.seats);
    }
    if (simulation.inventory.backs > overflowLimit) {
        overflowItems.push('Backs: ' + simulation.inventory.backs);
    }
    if (simulation.inventory.assembled > overflowLimit) {
        overflowItems.push('Assembled: ' + simulation.inventory.assembled);
    }

    if (overflowItems.length > 0 && !simulation.overflowAlertShown) {
        simulation.overflowAlertShown = true;
        alert('⚠️ TOO MUCH INVENTORY!\n\nThe following items have exceeded 300 units:\n\n' + overflowItems.join('\n') + '\n\nAdjust your production rates to balance the line!');

        // Reset flag after 5 seconds so alert can show again if problem persists
        setTimeout(function() {
            simulation.overflowAlertShown = false;
        }, 5000);
    }
}

function updateInventoryDisplay(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        
        // Color coding based on inventory level
        element.classList.remove('high', 'medium');
        if (value > 50) {
            element.classList.add('high');
        } else if (value > 20) {
            element.classList.add('medium');
        }
    }
}

function updateMachineStatus(id, text, statusClass) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
        element.className = 'machine-status ' + statusClass;
    }
}

function resetSimulation() {
    // Reset all values
    simulation.inventory = {
        steel: 0,
        wood: 0,
        bolts: 0,
        rods: 0,
        legs: 0,
        seats: 0,
        backs: 0,
        assembled: 0
    };

    simulation.produced = {
        rawMaterial: 0,
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0,
        qc: 0,
        final: 0
    };

    simulation.accumulator = {
        rawMaterial: 0,
        rawWood: 0,
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0,
        qc: 0
    };

    simulation.rejected = 0;
    simulation.totalTime = 0;
    simulation.lastUpdate = Date.now();
    simulation.overflowAlertShown = false;

    // Reset display
    updateDisplay();
    updateMachineStatus('status1', 'Running', 'running');
    updateMachineStatus('status2', 'Running', 'running');
    updateMachineStatus('status3', 'Running', 'running');
    updateMachineStatus('status4', 'Running', 'running');
    updateMachineStatus('status5', 'Running', 'running');
    updateMachineStatus('status6', 'Running', 'running');
    updateMachineStatus('status-qc', 'Running', 'running');
}