import React from 'react';
import { Card, Typography, Progress, Row, Col, Statistic } from 'antd';
import { TrophyOutlined, RocketOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import { useGameState } from '../hooks/useGameState';
import { GAME_CONSTANTS } from '../utils/aptosClient';

const { Title, Text } = Typography;

const StatsPanel: React.FC = () => {
  const { gameStats, transactionQueue } = useGameState();

  if (!gameStats) {
    return (
      <Card className="glass-card" loading>
        <div className="h-48" />
      </Card>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const prestigeProgress = (gameStats.totalCookies / GAME_CONSTANTS.PRESTIGE_THRESHOLD) * 100;
  const prestigePointsEarnable = Math.floor(gameStats.totalCookies / 1000000);

  const confirmedTxs = transactionQueue.filter(tx => tx.status === 'confirmed').length;
  const pendingTxs = transactionQueue.filter(tx => tx.status === 'pending' || tx.status === 'submitted').length;
  const failedTxs = transactionQueue.filter(tx => tx.status === 'failed').length;

  return (
    <Card className="glass-card" bodyStyle={{ padding: '24px' }}>
      <Title level={4} className="text-white mb-6 flex items-center gap-2">
        <TrophyOutlined className="text-yellow-400" />
        Player Statistics
      </Title>

      <Row gutter={[16, 16]}>
        {/* Core Stats */}
        <Col span={12}>
          <Statistic
            title={<span className="text-gray-300">Total Cookies</span>}
            value={gameStats.totalCookies}
            formatter={(value) => (
              <span className="text-yellow-400">{formatNumber(value as number)}</span>
            )}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span className="text-gray-300">Click Power</span>}
            value={gameStats.clickMultiplier}
            formatter={(value) => (
              <span className="text-green-400">{formatNumber(value as number)}x</span>
            )}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span className="text-gray-300">Cookies/Second</span>}
            value={gameStats.cookiesPerSecond}
            formatter={(value) => (
              <span className="text-blue-400">{formatNumber(value as number)}</span>
            )}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span className="text-gray-300">Prestige Level</span>}
            value={gameStats.prestigeLevel}
            formatter={(value) => (
              <span className="text-purple-400 flex items-center gap-1">
                <StarOutlined />
                {value}
              </span>
            )}
          />
        </Col>
      </Row>

      {/* Prestige Progress */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <Text className="text-gray-300">Progress to Prestige</Text>
          <Text className="text-purple-400">
            {formatNumber(gameStats.totalCookies)} / {formatNumber(GAME_CONSTANTS.PRESTIGE_THRESHOLD)}
          </Text>
        </div>
        <Progress
          percent={Math.min(prestigeProgress, 100)}
          strokeColor={{
            '0%': '#8B5CF6',
            '100%': '#A855F7',
          }}
          trailColor="#374151"
          showInfo={false}
        />
        {prestigePointsEarnable > 0 && (
          <Text className="text-purple-300 text-sm mt-1 block">
            Will earn {prestigePointsEarnable} prestige points
          </Text>
        )}
      </div>

      {/* Transaction Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <Title level={5} className="text-white mb-4 flex items-center gap-2">
          <RocketOutlined className="text-blue-400" />
          Transaction Status
        </Title>
        
        <Row gutter={[12, 12]} className="text-center">
          <Col span={8}>
            <div className="bg-green-900/30 rounded-lg p-3">
              <div className="text-green-400 font-bold text-xl">{confirmedTxs}</div>
              <Text className="text-green-300 text-xs">Confirmed</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-orange-900/30 rounded-lg p-3">
              <div className="text-orange-400 font-bold text-xl">{pendingTxs}</div>
              <Text className="text-orange-300 text-xs">Pending</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-red-900/30 rounded-lg p-3">
              <div className="text-red-400 font-bold text-xl">{failedTxs}</div>
              <Text className="text-red-300 text-xs">Failed</Text>
            </div>
          </Col>
        </Row>

        {pendingTxs > 0 && (
          <div className="mt-3 text-center">
            <Text className="text-orange-400 text-sm flex items-center justify-center gap-1">
              <ClockCircleOutlined className="animate-spin" />
              Processing orderless transactions...
            </Text>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <Title level={5} className="text-white mb-3">
          Orderless Performance
        </Title>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Text className="text-gray-400">Success Rate</Text>
            <div className="text-green-400 font-bold">
              {confirmedTxs + failedTxs > 0 
                ? ((confirmedTxs / (confirmedTxs + failedTxs)) * 100).toFixed(1)
                : '0'
              }%
            </div>
          </div>
          <div>
            <Text className="text-gray-400">Total Transactions</Text>
            <div className="text-blue-400 font-bold">
              {transactionQueue.length}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsPanel;