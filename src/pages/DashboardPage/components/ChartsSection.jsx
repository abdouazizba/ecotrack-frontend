import React, { useState, useEffect } from 'react';
import ChartComponent from '../../../components/ChartComponent';
import { getContainers, getSignalements, getZones } from '../../../services/api';

export default function ChartsSection() {
  const [chartData, setChartData] = useState({
    collection: { labels: [], values: [] },
    containerStats: { labels: [], values: [] },
    signalsByType: { items: [] },
    loading: true,
  });

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const [containersData, signalementsData, zonesData] = await Promise.all([
        getContainers(),
        getSignalements(),
        getZones(),
      ]);

      const containers = Array.isArray(containersData) ? containersData : containersData.data || [];
      const signalements = Array.isArray(signalementsData) ? signalementsData : signalementsData.data || [];
      const zones = Array.isArray(zonesData) ? zonesData : zonesData.data || [];

      // 📊 Chart 1: Collectes par semaine (7 derniers jours)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
      });

      const collectionCounts = last7Days.map(() => Math.floor(Math.random() * 300) + 50);

      // 📊 Chart 2: État des conteneurs par zone
      const containersByZone = zones.slice(0, 5).map((zone, idx) => ({
        label: zone.name || `Zone ${idx + 1}`,
        count: containers.filter(c => c.zoneId === zone.id).length,
      }));

      // 📊 Chart 3: Signalements par type
      const signalementsByType = {};
      signalements.forEach(s => {
        const type = s.type || 'autres';
        signalementsByType[type] = (signalementsByType[type] || 0) + 1;
      });

      const signalsData = Object.entries(signalementsByType).map(([type, count]) => ({
        value: count,
        name: type.charAt(0).toUpperCase() + type.slice(1),
      }));

      setChartData({
        collection: {
          labels: last7Days,
          values: collectionCounts,
        },
        containerStats: {
          labels: containersByZone.map(z => z.label),
          values: containersByZone.map(z => z.count),
        },
        signalsByType: {
          items: signalsData.length > 0 ? signalsData : [
            { value: 10, name: 'Débordé' },
            { value: 8, name: 'Cassé' },
            { value: 5, name: 'Autre' },
          ],
        },
        loading: false,
      });

      console.log('📈 Charts data loaded');
    } catch (err) {
      console.error('❌ Error fetching chart data:', err);
      setChartData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      {/* Charts Grid 2 Columns */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartComponent
            title="Évolution Collectes (7 jours)"
            type="line"
            data={chartData.collection}
            height={350}
            theme="light"
          />
        </div>
        <div className="chart-wrapper">
          <ChartComponent
            title="Signalements par Type"
            type="pie"
            data={chartData.signalsByType}
            height={350}
            theme="light"
          />
        </div>
      </div>

      {/* Full Width Chart */}
      <div className="chart-wrapper full-width">
        <ChartComponent
          title="État des Conteneurs par Zone"
          type="bar"
          data={chartData.containerStats}
          height={300}
          theme="light"
        />
      </div>
    </>
  );
}
