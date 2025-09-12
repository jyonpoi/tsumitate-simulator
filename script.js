document.getElementById("calculator").addEventListener("submit", function(e) {
  e.preventDefault();

  const monthly = parseFloat(document.getElementById("monthly").value);
  const rate = parseFloat(document.getElementById("rate").value) / 100 / 12;
  const years = parseInt(document.getElementById("years").value);
  const months = years * 12;
  const nisaMode = document.getElementById("nisaMode").checked;
  const principalLimit = 18000000; // 1800万円

  let total = 0;
  let principalAccumulated = 0;
  const totalData = [0];
  const principalData = [0];

  for (let i = 1; i <= months; i++) {
    let actualInvestment = monthly;

    if (nisaMode) {
      const remaining = principalLimit - principalAccumulated;
      if (remaining <= 0) {
        actualInvestment = 0;
      } else if (remaining < monthly) {
        actualInvestment = remaining;
      }
    }

    principalAccumulated += actualInvestment;
    total = (total + actualInvestment) * (1 + rate);

    if (i % 12 === 0) {
      totalData.push(Math.round(total));
      principalData.push(Math.round(principalAccumulated));
    }
  }

  const interest = total - principalAccumulated;

document.getElementById("result").innerHTML = `
  <strong>総資産額：¥${Math.round(total).toLocaleString()}</strong>
  <div class="result-item">元本：¥${Math.round(principalAccumulated).toLocaleString()}</div>
  <div class="result-item">利息：¥${Math.round(interest).toLocaleString()}</div>
`;

  const ctx = document.getElementById("growthChart").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: years + 1}, (_, i) => `${i}年目`),
      datasets: [
{
  label: '総資産額',
  data: totalData,
  borderColor: '#2ecc71',
  backgroundColor: 'rgba(46, 204, 113, 0.2)',
  fill: true,
  tension: 0.4,
  pointRadius: 4,
  pointHoverRadius: 8,
  pointBackgroundColor: '#2ecc71',
  pointHoverBackgroundColor: '#27ae60',
  pointBorderColor: '#ffffff',
  pointHoverBorderColor: '#f1c40f'
},
{
  label: '元本（積立額）',
  data: principalData,
  borderColor: '#9b59b6',
  backgroundColor: 'rgba(155, 89, 182, 0.2)',
  fill: false,
  borderDash: [5, 5],
  tension: 0.4,
  pointRadius: 4,
  pointHoverRadius: 8,
  pointBackgroundColor: '#9b59b6',
  pointHoverBackgroundColor: '#8e44ad',
  pointBorderColor: '#ffffff',
  pointHoverBorderColor: '#f1c40f'
}
      ]
    },
options: {
  responsive: true,
  maintainAspectRatio: true,
  interaction: {
    mode: 'index',
    intersect: false
  },
  animation: {
    duration: 1500,
    easing: 'easeOutQuart'
  },
  plugins: {
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ¥${value.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: value => `¥${value.toLocaleString()}`,
        color: '#e0f7fa'
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    x: {
      ticks: {
        color: '#e0f7fa'
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      }
    }
  }
}
  });
});