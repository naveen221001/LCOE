/**
 * Solar LCOE Calculator
 * Created: March 18, 2025
 * 
 * This script handles the functionality of a Solar LCOE (Levelized Cost of Electricity) Calculator
 * that works with the provided CSS styling.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  initTooltips();
  
  // Form elements
  const calculatorForm = document.getElementById('lcoe-calculator-form');
  const resetButton = document.getElementById('reset-calculator');
  
  // Input fields
  const systemSizeInput = document.getElementById('system-size');
  const systemCostInput = document.getElementById('system-cost');
  const incentivesInput = document.getElementById('incentives');
  const annualProductionInput = document.getElementById('annual-production');
  const systemLifeInput = document.getElementById('system-life');
  const degradationRateInput = document.getElementById('degradation-rate');
  const discountRateInput = document.getElementById('discount-rate');
  const maintenanceCostInput = document.getElementById('maintenance-cost');
  const electricityRateInput = document.getElementById('electricity-rate');
  const electricityInflationInput = document.getElementById('electricity-inflation');
  const locationSelect = document.getElementById('location');
  
  // Results elements
  const lcoeResultElement = document.getElementById('lcoe-result');
  const paybackPeriodElement = document.getElementById('payback-period');
  const totalSavingsElement = document.getElementById('total-savings');
  const roiElement = document.getElementById('roi');
  const resultsPanel = document.querySelector('.results-panel');
  const lcoeChart = document.getElementById('lcoe-chart');
  const savingsChart = document.getElementById('savings-chart');
  
  // Location-specific data (solar irradiance, incentives, etc.)
  const locationData = {
    'phoenix': {
      name: 'Phoenix, AZ',
      irradiance: 2300,
      incentives: 0.26, // 26% federal tax credit
      electricityRate: 0.13
    },
    'seattle': {
      name: 'Seattle, WA',
      irradiance: 1350,
      incentives: 0.36, // 26% federal + 10% state
      electricityRate: 0.11
    },
    'boston': {
      name: 'Boston, MA',
      irradiance: 1600,
      incentives: 0.46, // 26% federal + 20% state
      electricityRate: 0.22
    },
    'miami': {
      name: 'Miami, FL',
      irradiance: 2000,
      incentives: 0.26, // 26% federal
      electricityRate: 0.12
    },
    'denver': {
      name: 'Denver, CO',
      irradiance: 1950,
      incentives: 0.36, // 26% federal + 10% state
      electricityRate: 0.13
    },
    'austin': {
      name: 'Austin, TX',
      irradiance: 1900,
      incentives: 0.26, // 26% federal
      electricityRate: 0.11
    },
    'custom': {
      name: 'Custom Location',
      irradiance: 1800,
      incentives: 0.26,
      electricityRate: 0.14
    }
  };
  
  // Initialize charts
  let lcoeChartInstance = null;
  let savingsChartInstance = null;
  
  // Event listeners
  if (calculatorForm) {
    calculatorForm.addEventListener('submit', calculateLCOE);
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', resetCalculator);
  }
  
  if (locationSelect) {
    locationSelect.addEventListener('change', updateLocationDefaults);
  }
  
  // Initialize location defaults
  updateLocationDefaults();
  
  /**
   * Calculate LCOE and related metrics
   * @param {Event} e - Form submit event
   */
  function calculateLCOE(e) {
    e.preventDefault();
    
    // Get input values
    const systemSize = parseFloat(systemSizeInput.value);
    const systemCost = parseFloat(systemCostInput.value);
    const incentives = parseFloat(incentivesInput.value) / 100;
    const annualProduction = parseFloat(annualProductionInput.value);
    const systemLife = parseInt(systemLifeInput.value);
    const degradationRate = parseFloat(degradationRateInput.value) / 100;
    const discountRate = parseFloat(discountRateInput.value) / 100;
    const maintenanceCost = parseFloat(maintenanceCostInput.value);
    const electricityRate = parseFloat(electricityRateInput.value);
    const electricityInflation = parseFloat(electricityInflationInput.value) / 100;
    
    // Calculate net system cost after incentives
    const netSystemCost = systemCost * (1 - incentives);
    
    // Calculate LCOE
    let totalDiscountedEnergy = 0;
    let totalDiscountedCost = netSystemCost;
    
    // Arrays for charts
    const years = Array.from({length: systemLife}, (_, i) => i + 1);
    const lcoeValues = [];
    const savingsValues = [];
    let cumulativeSavings = 0;
    let paybackYear = systemLife;
    
    for (let year = 1; year <= systemLife; year++) {
      // Calculate energy production for the year with degradation
      const yearlyProduction = annualProduction * Math.pow(1 - degradationRate, year - 1);
      
      // Calculate discounted energy
      const discountFactor = 1 / Math.pow(1 + discountRate, year);
      const discountedEnergy = yearlyProduction * discountFactor;
      totalDiscountedEnergy += discountedEnergy;
      
      // Calculate maintenance cost
      const yearlyMaintenance = maintenanceCost;
      const discountedMaintenance = yearlyMaintenance * discountFactor;
      totalDiscountedCost += discountedMaintenance;
      
      // Calculate electricity cost savings
      const yearlyElectricityRate = electricityRate * Math.pow(1 + electricityInflation, year - 1);
      const yearlySavings = yearlyProduction * yearlyElectricityRate;
      const discountedSavings = yearlySavings * discountFactor;
      
      // Update cumulative savings
      cumulativeSavings += discountedSavings;
      savingsValues.push({
        year,
        yearlySavings: discountedSavings,
        cumulativeSavings: cumulativeSavings
      });
      
      // Check for payback year
      if (cumulativeSavings >= netSystemCost && paybackYear === systemLife) {
        paybackYear = year;
      }
      
      // Calculate LCOE for each year
      const yearlyLCOE = totalDiscountedCost / totalDiscountedEnergy;
      lcoeValues.push({
        year,
        lcoe: yearlyLCOE
      });
    }
    
    // Final LCOE ($/kWh)
    const lcoe = totalDiscountedCost / totalDiscountedEnergy;
    
    // ROI calculation
    const roi = ((cumulativeSavings - netSystemCost) / netSystemCost) * 100;
    
    // Update result elements
    lcoeResultElement.textContent = `$${lcoe.toFixed(3)}/kWh`;
    paybackPeriodElement.textContent = `${paybackYear.toFixed(1)} years`;
    totalSavingsElement.textContent = `$${cumulativeSavings.toFixed(2)}`;
    roiElement.textContent = `${roi.toFixed(1)}%`;
    
    // Show results panel with animation
    resultsPanel.classList.remove('hidden');
    resultsPanel.classList.add('pulse');
    setTimeout(() => {
      resultsPanel.classList.remove('pulse');
    }, 2000);
    
    // Update charts
    updateCharts(years, lcoeValues, savingsValues);
  }
  
  /**
   * Reset calculator to default values
   */
  function resetCalculator() {
    calculatorForm.reset();
    updateLocationDefaults();
    
    if (resultsPanel) {
      resultsPanel.classList.add('hidden');
    }
    
    // Clear charts
    if (lcoeChartInstance) {
      lcoeChartInstance.destroy();
      lcoeChartInstance = null;
    }
    
    if (savingsChartInstance) {
      savingsChartInstance.destroy();
      savingsChartInstance = null;
    }
  }
  
  /**
   * Update default values based on selected location
   */
  function updateLocationDefaults() {
    const selectedLocation = locationSelect.value;
    const location = locationData[selectedLocation];
    
    if (location) {
      // Update input fields with location-specific defaults
      incentivesInput.value = (location.incentives * 100).toFixed(0);
      electricityRateInput.value = location.electricityRate.toFixed(2);
      
      // Update annual production based on system size and location irradiance
      if (systemSizeInput.value) {
        const systemSize = parseFloat(systemSizeInput.value);
        const estimatedProduction = systemSize * location.irradiance;
        annualProductionInput.value = estimatedProduction.toFixed(0);
      }
      
      // Show location-specific alert
      const locationAlert = document.getElementById('location-alert');
      if (locationAlert) {
        locationAlert.textContent = `Selected location: ${location.name} - Average irradiance: ${location.irradiance} kWh/m²/year`;
        locationAlert.classList.remove('hidden');
      }
    }
  }
  
  /**
   * Update charts with new data
   */
  function updateCharts(years, lcoeValues, savingsValues) {
    // Update LCOE chart
    if (lcoeChart) {
      const ctx = lcoeChart.getContext('2d');
      
      if (lcoeChartInstance) {
        lcoeChartInstance.destroy();
      }
      
      lcoeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'LCOE ($/kWh)',
            data: lcoeValues.map(item => item.lcoe),
            borderColor: 'rgba(4, 150, 255, 1)',
            backgroundColor: 'rgba(4, 150, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: '$/kWh'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Levelized Cost of Electricity Over Time'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `LCOE: $${context.raw.toFixed(3)}/kWh`;
                }
              }
            }
          }
        }
      });
    }
    
    // Update Savings chart
    if (savingsChart) {
      const ctx = savingsChart.getContext('2d');
      
      if (savingsChartInstance) {
        savingsChartInstance.destroy();
      }
      
      savingsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Yearly Savings',
              data: savingsValues.map(item => item.yearlySavings),
              backgroundColor: 'rgba(46, 204, 113, 0.7)',
              borderColor: 'rgba(46, 204, 113, 1)',
              borderWidth: 1
            },
            {
              label: 'Cumulative Savings',
              data: savingsValues.map(item => item.cumulativeSavings),
              type: 'line',
              borderColor: 'rgba(249, 166, 26, 1)',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              borderWidth: 2,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Yearly Savings ($)'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: true,
              title: {
                display: true,
                text: 'Cumulative Savings ($)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Projected Savings Over Time'
            }
          }
        }
      });
    }
  }
  
  /**
   * Initialize tooltips
   */
  function initTooltips() {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
      // Enhance tooltip accessibility
      const tooltipText = tooltip.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltip.setAttribute('aria-describedby', tooltipText.id);
      }
    });
  }
  
  /**
   * Helper function to format currency
   * @param {number} value - Value to format
   * @returns {string} Formatted currency string
   */
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }
  
  /**
   * Helper function to format percentage
   * @param {number} value - Value to format
   * @returns {string} Formatted percentage string
   */
  function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }
  
  // Export functions for testing or external use
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateLCOE,
      resetCalculator,
      updateLocationDefaults,
      formatCurrency,
      formatPercentage
    };
  }
});
