import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button, Dropdown, Tag, Typography, message } from 'antd';
import { WalletOutlined, DisconnectOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

const WalletConnector: React.FC = () => {
  const {
    connect,
    disconnect,
    connected,
    account,
    wallets,
    wallet,
  } = useWallet();

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      message.success(`Connected to ${walletName}`);
    } catch (error: any) {
      console.error('Connection failed:', error);
      message.error(`Failed to connect: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      message.info('Wallet disconnected');
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      message.error(`Failed to disconnect: ${error.message}`);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  if (connected && account && wallet) {
    const menuItems: MenuProps['items'] = [
      {
        key: 'disconnect',
        icon: <DisconnectOutlined />,
        label: 'Disconnect',
        onClick: handleDisconnect,
        danger: true,
      },
    ];

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <UserOutlined className="text-green-400" />
            <Text className="text-white font-medium">
              {formatAddress(account.address.toString())}
            </Text>
          </div>
          <Tag color="green" className="mt-1">
            {wallet.name}
          </Tag>
        </div>
        
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button 
            type="primary" 
            icon={<WalletOutlined />} 
            className="bg-green-600 border-green-600 hover:bg-green-700"
          >
            Connected
          </Button>
        </Dropdown>
      </div>
    );
  }

  const availableWallets = wallets?.filter(wallet => wallet.readyState === 'Installed') ?? [];
  const notInstalledWallets = wallets?.filter(wallet => wallet.readyState === 'NotDetected') ?? [];

  const walletMenuItems: MenuProps['items'] = [
    ...availableWallets.map(wallet => ({
      key: wallet.name,
      label: (
        <div className="flex items-center gap-2 py-2">
          <img 
            src={wallet.icon} 
            alt={wallet.name} 
            className="w-6 h-6" 
          />
          <span>{wallet.name}</span>
          <Tag color="green">Installed</Tag>
        </div>
      ),
      onClick: () => handleConnect(wallet.name),
    })),
    ...(notInstalledWallets.length > 0 ? [
      { type: 'divider' as const },
      ...notInstalledWallets.map(wallet => ({
        key: `${wallet.name}-not-installed`,
        label: (
          <div className="flex items-center gap-2 py-2 opacity-50">
            <img 
              src={wallet.icon} 
              alt={wallet.name} 
              className="w-6 h-6" 
            />
            <span>{wallet.name}</span>
            <Tag color="orange">Not Installed</Tag>
          </div>
        ),
        disabled: true,
        onClick: () => {
          window.open(wallet.url, '_blank');
        },
      })),
    ] : []),
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {availableWallets.length > 0 ? (
        <Dropdown
          menu={{ items: walletMenuItems }}
          placement="bottom"
          trigger={['click']}
        >
          <Button 
            type="primary" 
            icon={<WalletOutlined />} 
            size="large"
            className="bg-orange-600 border-orange-600 hover:bg-orange-700"
          >
            Connect Wallet
          </Button>
        </Dropdown>
      ) : (
        <div className="text-center">
          <Button 
            type="primary" 
            icon={<WalletOutlined />} 
            size="large"
            disabled
          >
            No Wallets Found
          </Button>
          <div className="mt-2 text-sm text-gray-400">
            Please install a compatible Aptos wallet:
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {notInstalledWallets.map(wallet => (
              <Button
                key={wallet.name}
                type="link"
                size="small"
                onClick={() => window.open(wallet.url, '_blank')}
                className="text-orange-400 hover:text-orange-300 p-0"
              >
                {wallet.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {!connected && (
        <Text className="text-gray-400 text-sm text-center max-w-md">
          Connect your Aptos wallet to start clicking cookies on the blockchain!
          Experience orderless transactions for rapid clicking.
        </Text>
      )}
    </div>
  );
};

export default WalletConnector;