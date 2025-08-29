import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, InputNumber, message, Space } from 'antd';
import { RobotOutlined, PlusOutlined } from '@ant-design/icons';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGameState } from '../hooks/useGameState';
import { buyAutoClicker } from '../utils/transactionUtils';
import { GAME_CONSTANTS } from '../utils/aptosClient';

const { Title, Text } = Typography;

const AutoClickerPanel: React.FC = () => {
  const wallet = useWallet();
  const { gameStats, autoClickers, optimisticCookies, transactionManager } = useGameState();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<number[]>([1, 1, 1]);

  if (!gameStats || !autoClickers) {
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

  const calculateCost = (basePrice: number, owned: number, quantity: number): number => {
    let totalCost = 0;
    for (let i = 0; i < quantity; i++) {
      const individualCost = basePrice * (Math.floor((owned + i) / 10) + 1);
      totalCost += individualCost;
    }
    return totalCost;
  };

  const handlePurchase = async (typeId: number) => {
    const quantity = quantities[typeId];
    const baseCost = GAME_CONSTANTS.AUTO_CLICKER_COSTS[typeId];
    const owned = autoClickers[typeId];
    const totalCost = calculateCost(baseCost, owned, quantity);
    
    if (optimisticCookies < totalCost) {
      message.warning('Not enough cookies!');
      return;
    }

    setPurchasing(typeId);

    try {
      await buyAutoClicker(wallet, transactionManager, typeId, quantity);
      message.success(`${quantity} ${GAME_CONSTANTS.AUTO_CLICKER_NAMES[typeId]}${quantity > 1 ? 's' : ''} purchased!`);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      message.error(`Purchase failed: ${error.message}`);
    } finally {
      setPurchasing(null);
    }
  };

  const setQuantity = (typeId: number, value: number | null) => {
    const newQuantities = [...quantities];
    newQuantities[typeId] = Math.max(1, Math.min(100, value || 1));
    setQuantities(newQuantities);
  };

  return (
    <Card className="glass-card" bodyStyle={{ padding: '24px' }}>
      <Title level={4} className="text-white mb-6 flex items-center gap-2">
        <RobotOutlined className="text-blue-400" />
        Auto-Clicker Shop
      </Title>

      <Text className="text-gray-300 block mb-6">
        Buy auto-clickers to generate passive cookie income! They work even when you're away.
      </Text>

      <Row gutter={[16, 16]}>
        {GAME_CONSTANTS.AUTO_CLICKER_NAMES.map((name, index) => {
          const baseCost = GAME_CONSTANTS.AUTO_CLICKER_COSTS[index];
          const rate = GAME_CONSTANTS.AUTO_CLICKER_RATES[index];
          const description = GAME_CONSTANTS.AUTO_CLICKER_DESCRIPTIONS[index];
          const owned = autoClickers[index];
          const quantity = quantities[index];
          const totalCost = calculateCost(baseCost, owned, quantity);
          const canAfford = optimisticCookies >= totalCost;
          const isPurchasing = purchasing === index;

          return (
            <Col xs={24} lg={8} key={index}>
              <Card
                className={`upgrade-card h-full ${
                  canAfford 
                    ? 'border-blue-500 bg-blue-900/10 hover:bg-blue-900/20'
                    : 'border-gray-600 bg-gray-900/20'
                }`}
                bodyStyle={{ padding: '16px' }}
              >
                <div className="text-center">
                  {/* Auto-Clicker Icon */}
                  <div className="text-4xl mb-3">
                    {index === 0 && '\ud83d\udc75'} {/* Grandma */}
                    {index === 1 && '\ud83c\udfe2'} {/* Factory */}
                    {index === 2 && '\ud83c\udfe6'} {/* Bank */}
                  </div>

                  {/* Auto-Clicker Name */}
                  <Title level={5} className="text-white mb-2">
                    {name}
                  </Title>

                  {/* Rate */}
                  <div className="mb-3">
                    <span className="text-blue-400 font-bold text-xl">
                      {formatNumber(rate)}
                    </span>
                    <Text className="text-gray-400 block text-sm">cookies/sec each</Text>
                  </div>

                  {/* Description */}
                  <Text className="text-gray-300 text-sm block mb-4">
                    {description}
                  </Text>

                  {/* Owned Count */}
                  <div className="mb-4">
                    <Text className="text-gray-400 text-sm">Owned: </Text>
                    <Text className="text-green-400 font-bold">{owned}</Text>
                    <br />
                    <Text className="text-gray-400 text-sm">Total Production: </Text>
                    <Text className="text-green-400 font-bold">
                      {formatNumber(owned * rate)}/sec
                    </Text>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <Text className="text-gray-400 text-sm block mb-2">Quantity:</Text>
                    <Space.Compact>
                      <InputNumber
                        min={1}
                        max={100}
                        value={quantity}
                        onChange={(value) => setQuantity(index, value)}
                        className="w-20"
                        size="small"
                      />
                    </Space.Compact>
                  </div>

                  {/* Cost */}
                  <div className="mb-4">
                    <Text className="text-gray-400 text-sm block">
                      Cost for {quantity}:
                    </Text>
                    <Text className={`font-bold ${
                      canAfford ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatNumber(totalCost)} cookies
                    </Text>
                    {quantity > 1 && (
                      <Text className="text-gray-400 text-xs block">
                        (~{formatNumber(totalCost / quantity)} each)
                      </Text>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={isPurchasing}
                    disabled={!canAfford}
                    onClick={() => handlePurchase(index)}
                    className={canAfford
                      ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                      : 'opacity-50'
                    }
                    icon={<PlusOutlined />}
                  >
                    {isPurchasing 
                      ? 'Purchasing...' 
                      : canAfford 
                      ? `Buy ${quantity}` 
                      : 'Need More Cookies'
                    }
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Quick Buy Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <Title level={5} className="text-white mb-3">Quick Buy</Title>
        <Row gutter={[8, 8]}>
          {[1, 10, 25, 100].map(qty => (
            <Col key={qty}>
              <Button
                size="small"
                onClick={() => setQuantities([qty, qty, qty])}
                className="text-gray-300 hover:text-white"
              >
                {qty}x All
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      <div className="mt-4">
        <Text className="text-gray-400 text-sm">
          \ud83d\udca1 Tip: Auto-clicker prices increase every 10 units. Buy in bulk when you can afford it!
        </Text>
      </div>
    </Card>
  );
};

export default AutoClickerPanel;