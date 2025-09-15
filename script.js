// カスタムハイライトプラグイン：ツールチップの位置に棒を描画
const customHighlightPlugin = {
  id: 'customHighlight',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const tooltip = chart.tooltip;

    if (!tooltip || !tooltip.opacity || !tooltip.dataPoints) return;

    tooltip.dataPoints.forEach(point => {
      const x = point.element.x;
      const y = point.element.y;
      const chartBottom = chart.chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, chartBottom);
      ctx.lineWidth = 4;
      ctx.strokeStyle = point.dataset.borderColor || '#ffffff';
      ctx.stroke();
      ctx.restore();
    });
  }
};

function calculateAndRender(monthly, ratePercent, years, nisaMode, initial, bonusMonths) {
  const rate = ratePercent / 100 / 12;
  const months = years * 12;
  const principalLimit = 18000000;

  let total = initial;
  let principalAccumulated = initial;
  const totalData = [Math.round(total)];
  const principalData = [Math.round(principalAccumulated)];

  for (let i = 1; i <= months; i++) {
    let actualInvestment = monthly;

    // NISAモード制限（通常積立）
    if (nisaMode) {
      const remaining = principalLimit - principalAccumulated;
      if (remaining <= 0) {
        actualInvestment = 0;
      } else if (remaining < monthly) {
        actualInvestment = remaining;
      }
    }

    // ボーナス月の追加投資
    const currentMonth = (i % 12) || 12;
    const bonus = bonusMonths[currentMonth] || 0;

    if (nisaMode) {
      const remaining = principalLimit - principalAccumulated;
      if (remaining > 0) {
        actualInvestment += Math.min(bonus, remaining - actualInvestment);
      }
    } else {
      actualInvestment += bonus;
    }

    principalAccumulated += actualInvestment;
    total = (total + actualInvestment) * (1 + rate);

    if (i % 12 === 0) {
      totalData.push(Math.round(total));
      principalData.push(Math.round(principalAccumulated));
    }
  }

  const interest = total - principalAccumulated;

  // 基本項目の表示
  let basicHTML = `
    <div class="input-item">月々の積立額：¥${monthly.toLocaleString()}</div>
    <div class="input-item">年利：${ratePercent.toFixed(2)}%</div>
    <div class="input-item">積立年数：${years}年</div>
  `;
  document.getElementById("inputSummaryBasic").innerHTML = basicHTML;

  // 詳細設定の表示（入力がある場合のみ）
  let detailsHTML = '';
  if (initial > 0) {
    detailsHTML += `<div class="input-item">初期投資額：¥${initial.toLocaleString()}</div>`;
  }
  Object.entries(bonusMonths).forEach(([month, amount]) => {
    if (amount > 0) {
      detailsHTML += `<div class="input-item">${month}月ボーナス投資：¥${amount.toLocaleString()}</div>`;
    }
  });
  document.getElementById("inputSummaryDetails").innerHTML = detailsHTML;

  // 結果表示
  document.getElementById("result").innerHTML = `
    <strong>総資産額：¥${Math.round(total).toLocaleString()}</strong>
    <div class="result-item">元本：¥${Math.round(principalAccumulated).toLocaleString()}</div>
    <div class="result-item">利息：¥${Math.round(interest).toLocaleString()}</div>
  `;

  // グラフ描画
  const canvas = document.getElementById("growthChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (window.myChart && typeof window.myChart.destroy === 'function') {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: years + 1 }, (_, i) => `${i}年目`),
      datasets: [
        {
          label: '総資産額',
          data: totalData,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: '元本（積立額）',
          data: principalData,
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.2)',
          fill: false,
          borderDash: [5, 5],
          tension: 0.4
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
          backgroundColor: '#2a2a3d',
          titleColor: '#ffffff',
          bodyColor: '#eeeeee',
          borderColor: '#2ecc71',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            title: function(context) {
              return `【${context[0].label}】`;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `▶ ${label}：¥${value.toLocaleString()}`;
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
    },
    plugins: [customHighlightPlugin]
  });
}

function toggleDetails() {
  const section = document.getElementById("detailsSection");
  section.classList.toggle("hidden");
}

// 初期表示（グラフのみ）
window.addEventListener("DOMContentLoaded", () => {
  const defaultMonthly = 30000;
  const defaultRate = 3.5;
  const defaultYears = 20;
  const defaultNisa = false;
  const defaultInitial = 0;
  const defaultBonus = { 3: 0, 6: 0, 9: 0, 12: 0 };

  calculateAndRender(defaultMonthly, defaultRate, defaultYears, defaultNisa, defaultInitial, defaultBonus);
});

// フォーム送信時の処理
document.getElementById("calculator").addEventListener("submit", function(e) {
  e.preventDefault();

  const monthly = parseFloat(document.getElementById("monthly")?.value) || 0;
  const rate = parseFloat(document.getElementById("rate")?.value) || 0;
  const years = parseInt(document.getElementById("years")?.value) || 0;
  const nisaMode = document.getElementById("nisaMode")?.checked || false;
  const initial = parseFloat(document.getElementById("initial")?.value) || 0;
  const bonusMonths = {
    3: parseFloat(document.getElementById("bonus3")?.value) || 0,
    6: parseFloat(document.getElementById("bonus6")?.value) || 0,
    9: parseFloat(document.getElementById("bonus9")?.value) || 0,
    12: parseFloat(document.getElementById("bonus12")?.value) || 0
  };

  calculateAndRender(monthly, rate, years, nisaMode, initial, bonusMonths);
});