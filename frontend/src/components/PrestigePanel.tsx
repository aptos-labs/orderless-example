import React, { useState } from 'react';
import { Card, Button, Typography, Progress, message, Modal } from 'antd';
import { StarOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGameState } from '../hooks/useGameState';
import { prestigeReset } from '../utils/transactionUtils';
import { GAME_CONSTANTS } from '../utils/aptosClient';

const { Title, Text, Paragraph } = Typography;

const PrestigePanel: React.FC = () => {
  const wallet = useWallet();
  const { gameStats, optimisticCookies, transactionManager } = useGameState();
  const [prestiging, setPrestiging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!gameStats) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const canPrestige = optimisticCookies >= GAME_CONSTANTS.PRESTIGE_THRESHOLD;
  const prestigePoints = Math.floor(optimisticCookies / 1000000);
  const progressPercent = (optimisticCookies / GAME_CONSTANTS.PRESTIGE_THRESHOLD) * 100;

  const handlePrestige = async () => {
    if (!canPrestige) {
      message.warning('Not enough cookies to prestige!');
      return;
    }

    setPrestiging(true);
    setShowConfirmModal(false);

    try {
      await prestigeReset(wallet, transactionManager);
      message.success(`Prestige successful! Gained ${prestigePoints} prestige points!`);
    } catch (error: any) {
      console.error('Prestige failed:', error);
      message.error(`Prestige failed: ${error.message}`);
    } finally {
      setPrestiging(false);
    }
  };

  return (
    <>
      <Card className="glass-card" bodyStyle={{ padding: '24px' }}>
        <Title level={4} className="text-white mb-4 flex items-center gap-2">
          <StarOutlined className="text-purple-400" />
          Prestige System
        </Title>

        {gameStats.prestigeLevel > 0 && (
          <div className="mb-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <Text className="text-purple-300">Current Prestige Level</Text>
              <div className="flex items-center gap-1">
                <TrophyOutlined className="text-purple-400" />
                <Text className="text-purple-400 font-bold text-xl">
                  {gameStats.prestigeLevel}
                </Text>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Text className="text-gray-300">Progress to Prestige</Text>
            <Text className="text-purple-400">
              {formatNumber(optimisticCookies)} / {formatNumber(GAME_CONSTANTS.PRESTIGE_THRESHOLD)}
            </Text>
          </div>
          
          <Progress
            percent={Math.min(progressPercent, 100)}
            strokeColor={{
              '0%': '#8B5CF6',
              '50%': '#A855F7',
              '100%': '#C084FC',
            }}
            trailColor="#374151"
            showInfo={false}
            strokeWidth={12}
            className="mb-2"
          />
          
          <Text className="text-gray-400 text-sm">
            {canPrestige 
              ? `Ready to prestige! Will gain ${prestigePoints} prestige points.`
              : `Need ${formatNumber(GAME_CONSTANTS.PRESTIGE_THRESHOLD - optimisticCookies)} more cookies.`
            }
          </Text>
        </div>

        {canPrestige && (
          <div className="mb-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
            <Title level={5} className="text-purple-300 mb-2 flex items-center gap-2">
              <StarOutlined />
              Prestige Rewards
            </Title>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="text-gray-300">Prestige Points:</Text>
                <Text className="text-purple-400 font-bold">+{prestigePoints}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-300">Click Multiplier Bonus:</Text>
                <Text className="text-green-400 font-bold">+{prestigePoints}x</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-300">New Base Multiplier:</Text>
                <Text className="text-yellow-400 font-bold">
                  {1 + (gameStats.prestigeLevel * prestigePoints) + prestigePoints}x
                </Text>
              </div>
            </div>
          </div>
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={prestiging}
          disabled={!canPrestige}
          onClick={() => setShowConfirmModal(true)}
          className={canPrestige 
            ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 py-3 h-auto'
            : 'opacity-50'
          }
          icon={<StarOutlined />}
        >
          {prestiging
            ? 'Prestiging...'
            : canPrestige
            ? `Prestige (+${prestigePoints} points)`
            : `Need ${formatNumber(GAME_CONSTANTS.PRESTIGE_THRESHOLD)} Cookies`
          }
        </Button>

        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <Text className="text-gray-400 text-sm">
            \ud83c\udfc6 <strong>What is Prestige?</strong><br />
            Prestige resets your progress but grants permanent bonuses based on cookies earned. 
            Each prestige point gives +1x to your base click multiplier forever!
          </Text>
        </div>
      </Card>

      <Modal
        title={
          <span className="text-white flex items-center gap-2">
            <WarningOutlined className="text-yellow-400" />
            Confirm Prestige
          </span>
        }
        open={showConfirmModal}
        onOk={handlePrestige}
        onCancel={() => setShowConfirmModal(false)}
        okText={`Yes, Prestige (+${prestigePoints} points)`}
        cancelText="Cancel"
        okButtonProps={{
          className: 'bg-purple-600 border-purple-600',
          loading: prestiging,
        }}
        className="prestige-modal"
      >
        <div className="py-4">
          <Paragraph className="text-gray-300 mb-4">
            <strong>Are you sure you want to prestige?</strong>
          </Paragraph>
          
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <Text className="text-red-300 font-semibold block mb-2">⚠️ This will reset:</Text>
            <ul className="text-red-300 text-sm space-y-1 ml-4">
              <li>• All cookies ({formatNumber(optimisticCookies)} cookies)</li>
              <li>• All upgrades (will need to repurchase)</li>
              <li>• All auto-clickers (will need to rebuy)</li>
              <li>• Lifetime click counter</li>
            </ul>
          </div>

          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <Text className="text-green-300 font-semibold block mb-2">✅ You will gain:</Text>
            <ul className="text-green-300 text-sm space-y-1 ml-4">
              <li>• {prestigePoints} prestige points</li>
              <li>• +{prestigePoints}x permanent click multiplier</li>
              <li>• Prestige level {gameStats.prestigeLevel + 1}</li>
              <li>• Bragging rights! \ud83c\udfc6</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PrestigePanel;