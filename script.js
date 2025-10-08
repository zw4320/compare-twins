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
    
    // Production rates (units per second)
    rates: {
        machine1: 5,  // Bolts
        machine2: 5,  // Rods
        machine3: 3,  // Legs (fixed rate)
        machine4: 3,  // Seats
        machine5: 3,  // Backs
        machine6: 2   // Chairs (fixed rate)
    },
    
    // Inventory/buffers
    inventory: {
        bolts: 0,
        rods: 0,
        legs: 0,
        seats: 0,
        backs: 0
    },
    
    // Production counters
    produced: {
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0
    },
    
    // Time tracking
    lastUpdate: Date.now(),
    totalTime: 0,
    
    // Accumulator for partial production
    accumulator: {
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0
    }
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
    // Machine 1 control
    const machine1Slider = document.getElementById('machine1-rate');
    if (machine1Slider) {
        machine1Slider.addEventListener('input', function() {
            simulation.rates.machine1 = parseFloat(this.value);
            document.getElementById('rate1').textContent = this.value;
        });
    }
    
    // Machine 2 control
    const machine2Slider = document.getElementById('machine2-rate');
    if (machine2Slider) {
        machine2Slider.addEventListener('input', function() {
            simulation.rates.machine2 = parseFloat(this.value);
            document.getElementById('rate2').textContent = this.value;
        });
    }
    
    // Machine 4 control
    const machine4Slider = document.getElementById('machine4-rate');
    if (machine4Slider) {
        machine4Slider.addEventListener('input', function() {
            simulation.rates.machine4 = parseFloat(this.value);
            document.getElementById('rate4').textContent = this.value;
        });
    }
    
    // Machine 5 control
    const machine5Slider = document.getElementById('machine5-rate');
    if (machine5Slider) {
        machine5Slider.addEventListener('input', function() {
            simulation.rates.machine5 = parseFloat(this.value);
            document.getElementById('rate5').textContent = this.value;
        });
    }
}

function startSimulation() {
    simulation.running = true;
    simulation.lastUpdate = Date.now();
    updateSimulation();
}

function updateSimulation() {
    if (!simulation.running) return;
    
    const now = Date.now();
    const deltaTime = (now - simulation.lastUpdate) / 1000; // Convert to seconds
    simulation.lastUpdate = now;
    simulation.totalTime += deltaTime;
    
    // Machine 1: Produce bolts
    simulation.accumulator.machine1 += simulation.rates.machine1 * deltaTime;
    if (simulation.accumulator.machine1 >= 1) {
        const boltsProduced = Math.floor(simulation.accumulator.machine1);
        simulation.inventory.bolts += boltsProduced;
        simulation.produced.machine1 += boltsProduced;
        simulation.accumulator.machine1 -= boltsProduced;
    }
    
    // Machine 2: Produce rods
    simulation.accumulator.machine2 += simulation.rates.machine2 * deltaTime;
    if (simulation.accumulator.machine2 >= 1) {
        const rodsProduced = Math.floor(simulation.accumulator.machine2);
        simulation.inventory.rods += rodsProduced;
        simulation.produced.machine2 += rodsProduced;
        simulation.accumulator.machine2 -= rodsProduced;
    }
    
    // Machine 3: Produce legs (needs 2 bolts + 1 rod)
    simulation.accumulator.machine3 += simulation.rates.machine3 * deltaTime;
    if (simulation.accumulator.machine3 >= 1) {
        const legsWanted = Math.floor(simulation.accumulator.machine3);
        const legsCanMake = Math.min(
            legsWanted,
            Math.floor(simulation.inventory.bolts / 2),
            simulation.inventory.rods
        );
        
        if (legsCanMake > 0) {
            simulation.inventory.bolts -= legsCanMake * 2;
            simulation.inventory.rods -= legsCanMake;
            simulation.inventory.legs += legsCanMake;
            simulation.produced.machine3 += legsCanMake;
            simulation.accumulator.machine3 -= legsCanMake;
            updateMachineStatus('status3', 'Running', 'running');
        } else {
            updateMachineStatus('status3', 'Waiting for parts', 'waiting');
        }
    }
    
    // Machine 4: Produce seats
    simulation.accumulator.machine4 += simulation.rates.machine4 * deltaTime;
    if (simulation.accumulator.machine4 >= 1) {
        const seatsProduced = Math.floor(simulation.accumulator.machine4);
        simulation.inventory.seats += seatsProduced;
        simulation.produced.machine4 += seatsProduced;
        simulation.accumulator.machine4 -= seatsProduced;
    }
    
    // Machine 5: Produce backs
    simulation.accumulator.machine5 += simulation.rates.machine5 * deltaTime;
    if (simulation.accumulator.machine5 >= 1) {
        const backsProduced = Math.floor(simulation.accumulator.machine5);
        simulation.inventory.backs += backsProduced;
        simulation.produced.machine5 += backsProduced;
        simulation.accumulator.machine5 -= backsProduced;
    }
    
    // Machine 6: Produce chairs (needs 1 leg + 1 seat + 1 back)
    simulation.accumulator.machine6 += simulation.rates.machine6 * deltaTime;
    if (simulation.accumulator.machine6 >= 1) {
        const chairsWanted = Math.floor(simulation.accumulator.machine6);
        const chairsCanMake = Math.min(
            chairsWanted,
            simulation.inventory.legs,
            simulation.inventory.seats,
            simulation.inventory.backs
        );
        
        if (chairsCanMake > 0) {
            simulation.inventory.legs -= chairsCanMake;
            simulation.inventory.seats -= chairsCanMake;
            simulation.inventory.backs -= chairsCanMake;
            simulation.produced.machine6 += chairsCanMake;
            simulation.accumulator.machine6 -= chairsCanMake;
            updateMachineStatus('status6', 'Running', 'running');
        } else {
            updateMachineStatus('status6', 'Waiting for parts', 'waiting');
        }
    }
    
    // Update display
    updateDisplay();
    
    // Continue simulation
    requestAnimationFrame(updateSimulation);
}

function updateDisplay() {
    // Update production counts
    updateElement('count1', simulation.produced.machine1);
    updateElement('count2', simulation.produced.machine2);
    updateElement('count3', simulation.produced.machine3);
    updateElement('count4', simulation.produced.machine4);
    updateElement('count5', simulation.produced.machine5);
    updateElement('count6', simulation.produced.machine6);
    
    // Update inventory buffers
    updateInventoryDisplay('bolt-inventory', simulation.inventory.bolts);
    updateInventoryDisplay('rod-inventory', simulation.inventory.rods);
    updateInventoryDisplay('leg-inventory', simulation.inventory.legs);
    updateInventoryDisplay('seat-inventory', simulation.inventory.seats);
    updateInventoryDisplay('back-inventory', simulation.inventory.backs);
    
    // Update statistics
    updateElement('chairs-produced', simulation.produced.machine6);
    
    const productionRate = simulation.totalTime > 0 
        ? (simulation.produced.machine6 / simulation.totalTime * 60).toFixed(1)
        : '0.0';
    updateElement('production-rate', productionRate + ' /min');
    
    // Calculate efficiency (chairs produced vs maximum possible)
    const maxPossible = simulation.rates.machine6 * simulation.totalTime;
    const efficiency = maxPossible > 0 
        ? Math.min(100, (simulation.produced.machine6 / maxPossible * 100)).toFixed(0)
        : 100;
    updateElement('efficiency', efficiency + '%');
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
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
        bolts: 0,
        rods: 0,
        legs: 0,
        seats: 0,
        backs: 0
    };
    
    simulation.produced = {
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0
    };
    
    simulation.accumulator = {
        machine1: 0,
        machine2: 0,
        machine3: 0,
        machine4: 0,
        machine5: 0,
        machine6: 0
    };
    
    simulation.totalTime = 0;
    simulation.lastUpdate = Date.now();
    
    // Reset display
    updateDisplay();
    updateMachineStatus('status3', 'Running', 'running');
    updateMachineStatus('status6', 'Running', 'running');
}