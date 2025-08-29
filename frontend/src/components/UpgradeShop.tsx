import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, message } from 'antd';
import { ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGameState } from '../hooks/useGameState';
import { buyUpgrade } from '../utils/transactionUtils';
import { GAME_CONSTANTS } from '../utils/aptosClient';

const { Title, Text } = Typography;

const UpgradeShop: React.FC = () => {
  const wallet = useWallet();
  const { gameStats, upgrades, optimisticCookies, transactionManager } = useGameState();
  const [purchasing, setPurchasing] = useState<number | null>(null);

  if (!gameStats || !upgrades) {
    return (
      <Card className="glass-card" loading>
        <div className="h-64" />
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

  const handlePurchase = async (upgradeId: number) => {
    const cost = GAME_CONSTANTS.UPGRADE_COSTS[upgradeId];
    
    if (optimisticCookies < cost) {
      message.warning('Not enough cookies!');
      return;
    }

    if (upgrades[upgradeId]) {
      message.info('Upgrade already purchased!');
      return;
    }

    setPurchasing(upgradeId);

    try {
      await buyUpgrade(wallet, transactionManager, upgradeId);
      message.success(`${GAME_CONSTANTS.UPGRADE_NAMES[upgradeId]} purchased!`);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      message.error(`Purchase failed: ${error.message}`);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Card className="glass-card" bodyStyle={{ padding: '24px' }}>
      <Title level={4} className="text-white mb-6 flex items-center gap-2">
        <ShoppingCartOutlined className="text-green-400" />
        Upgrade Shop
      </Title>

      <Text className="text-gray-300 block mb-6">
        Purchase upgrades to multiply your clicking power permanently!
      </Text>

      <Row gutter={[16, 16]}>
        {GAME_CONSTANTS.UPGRADE_NAMES.map((name, index) => {
          const cost = GAME_CONSTANTS.UPGRADE_COSTS[index];
          const multiplier = GAME_CONSTANTS.UPGRADE_MULTIPLIERS[index];
          const description = GAME_CONSTANTS.UPGRADE_DESCRIPTIONS[index];
          const owned = upgrades[index];
          const canAfford = optimisticCookies >= cost;
          const isPurchasing = purchasing === index;

          return (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                className={`upgrade-card h-full ${
                  owned 
                    ? 'border-green-500 bg-green-900/20' 
                    : canAfford 
                    ? 'border-yellow-500 bg-yellow-900/10 hover:bg-yellow-900/20'
                    : 'border-gray-600 bg-gray-900/20'
                }`}
                bodyStyle={{ padding: '16px' }}
              >
                <div className="text-center">
                  {/* Upgrade Icon */}
                  <div className="text-4xl mb-3">
                    {index === 0 && '👆'}
                    {index === 1 && '✨'}
                    {index === 2 && '🌟'}
                  </div>

                  {/* Upgrade Name */}
                  <Title level={5} className="text-white mb-2">
                    {name}
                  </Title>

                  {/* Multiplier */}
                  <div className="mb-3">
                    <span className="text-yellow-400 font-bold text-xl">
                      {multiplier}x
                    </span>
                    <Text className="text-gray-400 block text-sm">multiplier</Text>
                  </div>

                  {/* Description */}
                  <Text className="text-gray-300 text-sm block mb-4">
                    {description}
                  </Text>

                  {/* Cost */}
                  <div className="mb-4">
                    <Text className="text-gray-400 text-sm block">Cost:</Text>
                    <Text className={`font-bold ${
                      canAfford ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatNumber(cost)} cookies
                    </Text>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    type={owned ? 'default' : 'primary'}
                    block
                    size="large"
                    loading={isPurchasing}
                    disabled={owned || !canAfford}
                    onClick={() => handlePurchase(index)}
                    className={owned 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : canAfford
                      ? 'bg-yellow-600 border-yellow-600 hover:bg-yellow-700'
                      : 'opacity-50'
                    }
                    icon={owned ? <CheckOutlined /> : <ShoppingCartOutlined />}
                  >
                    {owned 
                      ? 'Owned' 
                      : isPurchasing 
                      ? 'Purchasing...' 
                      : canAfford 
                      ? 'Purchase' 
                      : 'Need More Cookies'
                    }
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <Text className="text-gray-400 text-sm">
          💡 Tip: Upgrades stack multiplicatively! The more you buy, the more powerful each click becomes.
        </Text>
      </div>
    </Card>
  );
};

export default UpgradeShop;