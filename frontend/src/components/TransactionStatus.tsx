import React, { useState } from 'react';
import { Card, Typography, List, Tag, Button } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useGameState } from '../hooks/useGameState';

const { Text } = Typography;

const TransactionStatus: React.FC = () => {
  const { transactionQueue, transactionManager } = useGameState();
  const [collapsed, setCollapsed] = useState(true);

  if (transactionQueue.length === 0) {
    return null;
  }

  const pendingCount = transactionQueue.filter(tx => 
    tx.status === 'pending' || tx.status === 'submitted'
  ).length;

  const recentTransactions = transactionQueue.slice(-10).reverse();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return <ClockCircleOutlined className="text-orange-400" />;
      case 'confirmed':
        return <CheckCircleOutlined className="text-green-400" />;
      case 'failed':
        return <CloseCircleOutlined className="text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'submitted':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'click':
        return '🍪 Click';
      case 'upgrade':
        return '⬆️ Upgrade';
      case 'auto_clicker':
        return '🤖 Auto-Clicker';
      case 'collect_passive':
        return '💰 Collect';
      case 'prestige':
        return '⭐ Prestige';
      default:
        return type;
    }
  };

  const handleClearCompleted = () => {
    const completedIds = transactionQueue
      .filter(tx => tx.status === 'confirmed' || tx.status === 'failed')
      .map(tx => tx.id);
    
    completedIds.forEach(id => transactionManager.removeFromQueue(id));
  };

  return (
    <Card 
      className="glass-card mb-4" 
      bodyStyle={{ padding: '16px' }}
      size="small"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReloadOutlined className="text-blue-400" />
          <Text className="text-white font-medium">
            Orderless Transactions
          </Text>
          {pendingCount > 0 && (
            <Tag color="orange" className="animate-pulse">
              {pendingCount} Processing
            </Tag>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="small" 
            type="text" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400"
          >
            {collapsed ? 'Show' : 'Hide'} Details
          </Button>
          {transactionQueue.some(tx => tx.status === 'confirmed' || tx.status === 'failed') && (
            <Button 
              size="small" 
              type="text" 
              onClick={handleClearCompleted}
              className="text-gray-400"
            >
              Clear Completed
            </Button>
          )}
        </div>
      </div>

      {!collapsed && (
        <List
          size="small"
          dataSource={recentTransactions}
          renderItem={(transaction) => (
            <List.Item className="border-b border-gray-700 last:border-b-0 py-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {getStatusIcon(transaction.status)}
                  <Text className="text-gray-300">
                    {formatTransactionType(transaction.type)}
                  </Text>
                  {transaction.hash && (
                    <Text className="text-gray-500 text-xs font-mono">
                      {transaction.hash.slice(0, 8)}...
                    </Text>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag 
                    color={getStatusColor(transaction.status)} 
                    className="min-w-[80px] text-center"
                  >
                    {transaction.status.toUpperCase()}
                  </Tag>
                  <Text className="text-gray-500 text-xs">
                    {new Date(transaction.timestamp).toLocaleTimeString()}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: (
              <div className="text-gray-500 py-4">
                No recent transactions
              </div>
            )
          }}
        />
      )}

      {pendingCount > 0 && collapsed && (
        <div className="text-center">
          <Text className="text-orange-400 text-sm flex items-center justify-center gap-2">
            <ClockCircleOutlined className="animate-spin" />
            {pendingCount} transactions processing in parallel...
          </Text>
          <Text className="text-gray-500 text-xs block mt-1">
            Thanks to orderless processing, transactions can complete in any order!
          </Text>
        </div>
      )}
    </Card>
  );
};

export default TransactionStatus;