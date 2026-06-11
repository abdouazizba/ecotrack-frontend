import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdvancedCharts.css';

/* Timeline Chart - 30 jours de tendances */
export function TimelineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">📈 Tendances 30 Jours</h3>
        <div className="chart-loading">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">📈 Tendances 30 Jours</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorConteneurs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSignalements" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{
              background: '#fff',
              border: '1px solid #2dd4bf',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="conteneurs" 
            stroke="#2dd4bf" 
            fillOpacity={1} 
            fill="url(#colorConteneurs)" 
            name="Conteneurs"
          />
          <Area 
            type="monotone" 
            dataKey="signalements" 
            stroke="#f59e0b" 
            fillOpacity={1} 
            fill="url(#colorSignalements)"
            name="Signalements"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Heatmap - Activité par zone */
export function HeatmapChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">🔥 Heatmap - Activité par Zone</h3>
        <div className="chart-loading">Chargement des zones...</div>
      </div>
    );
  }

  const chartData = data;
  const COLORS = ['#0a3434', '#0d9488', '#2dd4bf', '#a2e4db', '#d1f2ed'];

  return (
    <div className="chart-container">
      <h3 className="chart-title">🔥 Heatmap - Activité par Zone</h3>
      <div className="heatmap-grid">
        {chartData.map((row) => (
          <div key={row.zone} className="heatmap-row">
            <div className="heatmap-label">{row.zone}</div>
            <div className="heatmap-cells">
              {Object.entries(row).filter(([key]) => key !== 'zone').map(([day, value]) => (
                <div
                  key={day}
                  className="heatmap-cell"
                  style={{
                    backgroundColor: getHeatmapColor(value),
                  }}
                  title={`${day}: ${value} événements`}
                >
                  <span className="heatmap-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>0</span>
        <div className="legend-gradient"></div>
        <span>100+</span>
      </div>
    </div>
  );
}

/* Distribution par statut */
export function StatusDistribution({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">🎯 Distribution Statut</h3>
        <div className="chart-loading">Chargement des données...</div>
      </div>
    );
  }

  const chartData = data;

  return (
    <div className="chart-container">
      <h3 className="chart-title">🎯 Distribution Statut</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value} items`}
            contentStyle={{
              background: '#fff',
              border: '1px solid #2dd4bf',
              borderRadius: '8px',
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => `${entry.payload.name} (${entry.payload.value})`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Comparaison zones */
export function ZonesComparison({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">📊 Conteneurs par Zone</h3>
        <div className="chart-loading">Chargement des zones...</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">📊 Conteneurs par Zone</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="zone" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{
              background: '#fff',
              border: '1px solid #2dd4bf',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="conteneurs" fill="#2dd4bf" radius={[8, 8, 0, 0]} name="Conteneurs" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Utilitaire pour couleur heatmap */
function getHeatmapColor(value) {
  if (value < 20) return '#d1f2ed';
  if (value < 40) return '#a2e4db';
  if (value < 60) return '#5cc2b6';
  if (value < 80) return '#0d9488';
  return '#0a3434';
}

/* Composant conteneur pour tous les graphiques */
export default function AdvancedCharts({ 
  timelineData = [],
  heatmapData = [],
  statusData = [],
  zoneData = [],
  loading = false
}) {
  if (loading) {
    return (
      <div className="advanced-charts-grid">
        <div className="chart-loading">Chargement des graphiques...</div>
      </div>
    );
  }

  return (
    <div className="advanced-charts-grid">
      <div className="chart-wrapper full-width">
        <TimelineChart data={timelineData} />
      </div>
      
      <div className="chart-wrapper half-width">
        <HeatmapChart data={heatmapData} />
      </div>
      
      <div className="chart-wrapper half-width">
        <StatusDistribution data={statusData} />
      </div>
      
      <div className="chart-wrapper full-width">
        <ZonesComparison data={zoneData} />
      </div>
    </div>
  );
}
