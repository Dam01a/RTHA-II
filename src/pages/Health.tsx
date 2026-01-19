import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Activity,
  Droplets,
  Scale,
  Thermometer,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockHealthMetrics } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { HealthMetric } from '@/types/health';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const metricConfig = {
  blood_pressure: {
    icon: HeartPulse,
    label: 'Blood Pressure',
    color: 'hsl(0, 72%, 55%)',
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
    unit: 'mmHg',
  },
  heart_rate: {
    icon: Activity,
    label: 'Heart Rate',
    color: 'hsl(174, 62%, 47%)',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    unit: 'bpm',
  },
  blood_sugar: {
    icon: Droplets,
    label: 'Blood Sugar',
    color: 'hsl(205, 85%, 55%)',
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    unit: 'mg/dL',
  },
  weight: {
    icon: Scale,
    label: 'Weight',
    color: 'hsl(152, 60%, 45%)',
    bgClass: 'bg-success/10',
    textClass: 'text-success',
    unit: 'lbs',
  },
  temperature: {
    icon: Thermometer,
    label: 'Temperature',
    color: 'hsl(38, 92%, 50%)',
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    unit: '°F',
  },
};

type MetricType = keyof typeof metricConfig;

export default function Health() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('blood_pressure');

  // Process data for chart
  const getChartData = (type: MetricType) => {
    return mockHealthMetrics
      .filter((m) => m.type === type)
      .map((m) => ({
        date: m.date,
        value: type === 'blood_pressure' ? parseInt(m.value.split('/')[0]) : parseFloat(m.value),
        displayValue: m.value,
      }))
      .reverse();
  };

  const chartData = getChartData(selectedMetric);
  const config = metricConfig[selectedMetric];

  // Get latest values for each metric type
  const getLatestMetric = (type: MetricType) => {
    return mockHealthMetrics.find((m) => m.type === type);
  };

  // Trend calculation (simple comparison with previous)
  const getTrend = (type: MetricType) => {
    const metrics = mockHealthMetrics.filter((m) => m.type === type);
    if (metrics.length < 2) return 'stable';
    const current = parseFloat(metrics[0].value.split('/')[0]);
    const previous = parseFloat(metrics[1].value.split('/')[0]);
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Health Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor your vital signs and health metrics
          </p>
        </div>
        <Button className="gap-2 gradient-primary shadow-glow">
          <Plus className="h-5 w-5" />
          Log Reading
        </Button>
      </motion.div>

      {/* Metric Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        {(Object.keys(metricConfig) as MetricType[]).map((type, index) => {
          const cfg = metricConfig[type];
          const latest = getLatestMetric(type);
          const trend = getTrend(type);
          const isSelected = selectedMetric === type;

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => setSelectedMetric(type)}
              className={cn(
                'relative rounded-2xl p-4 text-left transition-all duration-200',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-card hover:shadow-md'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isSelected ? 'bg-white/20' : cfg.bgClass
                  )}
                >
                  <cfg.icon
                    className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-primary-foreground' : cfg.textClass
                    )}
                  />
                </div>
                {trend !== 'stable' && (
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full',
                      isSelected
                        ? 'bg-white/20'
                        : trend === 'up'
                        ? 'bg-destructive/10'
                        : 'bg-success/10'
                    )}
                  >
                    {trend === 'up' ? (
                      <TrendingUp
                        className={cn(
                          'h-3 w-3',
                          isSelected ? 'text-primary-foreground' : 'text-destructive'
                        )}
                      />
                    ) : (
                      <TrendingDown
                        className={cn(
                          'h-3 w-3',
                          isSelected ? 'text-primary-foreground' : 'text-success'
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
              <p
                className={cn(
                  'text-xs font-medium mb-1',
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {cfg.label}
              </p>
              {latest ? (
                <p className="text-xl font-bold">
                  {latest.value}
                  <span
                    className={cn(
                      'ml-1 text-xs font-normal',
                      isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {cfg.unit}
                  </span>
                </p>
              ) : (
                <p
                  className={cn(
                    'text-sm',
                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  No data
                </p>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bgClass)}>
              <config.icon className={cn('h-5 w-5', config.textClass)} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{config.label} Trends</h3>
              <p className="text-sm text-muted-foreground">Last 7 readings</p>
            </div>
          </div>
        </div>

        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.split('-').slice(1).join('/')}
                />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  formatter={(value: number, name: string, props: any) => [
                    props.payload.displayValue,
                    config.label,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={3}
                  dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>No data available for this metric</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Readings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card p-6 shadow-sm"
      >
        <h3 className="mb-4 font-semibold text-foreground">Recent Readings</h3>
        <div className="space-y-3">
          {mockHealthMetrics.slice(0, 8).map((metric, index) => {
            const cfg = metricConfig[metric.type as MetricType];

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', cfg.bgClass)}>
                    <cfg.icon className={cn('h-5 w-5', cfg.textClass)} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cfg.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.date} at {metric.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {metric.value}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {cfg.unit}
                    </span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
