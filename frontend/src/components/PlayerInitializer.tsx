import React, { useState } from 'react';
import { Button, Card, Typography, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGameState } from '../hooks/useGameState';
import { initializePlayer } from '../utils/transactionUtils';

const { Title, Paragraph } = Typography;

const PlayerInitializer: React.FC = () => {
  const [initializing, setInitializing] = useState(false);
  const { connected } = useWallet();
  const wallet = useWallet();
  const { refreshGameData } = useGameState();

  const handleInitialize = async () => {
    if (!connected || !wallet.account) {
      message.error('Please connect your wallet first');
      return;
    }

    setInitializing(true);

    try {
      const txHash = await initializePlayer(wallet);
      message.success('Player initialized successfully!');
      console.log('Initialization transaction:', txHash);
      
      // Wait a moment then refresh game data
      setTimeout(() => {
        refreshGameData();
      }, 2000);

    } catch (error: any) {
      console.error('Initialization failed:', error);
      
      if (error.message.includes('ALREADY_EXISTS')) {
        message.info('Player already initialized! Refreshing data...');
        refreshGameData();
      } else {
        message.error(`Failed to initialize player: ${error.message}`);
      }
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20">
      <Card className="glass-card text-center">
        <div className="mb-8">
          <div className="text-8xl mb-6">🍪</div>
          <Title level={2} className="text-white mb-4">
            Welcome to Cookie Clicker Aptos!
          </Title>
        </div>

        <div className="mb-8">
          <Paragraph className="text-gray-300 text-lg mb-6">
            You're about to embark on a delicious journey of cookie clicking on the Aptos blockchain!
            Initialize your player account to start earning cookies with orderless transactions.
          </Paragraph>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="text-white font-semibold mb-1">Rapid Clicking</h4>
              <p className="text-gray-400 text-sm">
                Click as fast as you want! Aggregators handle concurrent transactions.
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="text-white font-semibold mb-1">Orderless Processing</h4>
              <p className="text-gray-400 text-sm">
                Transactions process in any order without conflicts or race conditions.
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl mb-2">🛒</div>
              <h4 className="text-white font-semibold mb-1">Upgrades & Auto-Clickers</h4>
              <p className="text-gray-400 text-sm">
                Buy upgrades to multiply your clicks and auto-clickers for passive income.
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl mb-2">🌟</div>
              <h4 className="text-white font-semibold mb-1">Prestige System</h4>
              <p className="text-gray-400 text-sm">
                Reset your progress for permanent multipliers and prestige points.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          loading={initializing}
          onClick={handleInitialize}
          className="bg-orange-600 border-orange-600 hover:bg-orange-700 px-12 py-6 text-xl h-auto"
        >
          {initializing ? 'Initializing Player...' : 'Start Cookie Adventure!'}
        </Button>

        <div className="mt-6 text-sm text-gray-400">
          <p>
            This will create your player account on the Aptos blockchain.
            <br />
            You'll need to approve this transaction in your wallet.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PlayerInitializer;