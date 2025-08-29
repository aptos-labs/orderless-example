import React, { useState, useEffect } from 'react';
import { Button, Card, Steps, Typography, Space, message, Modal, Input, Tooltip, QRCode } from 'antd';
import { 
  WalletOutlined, 
  CopyOutlined, 
  ExportOutlined, 
  ImportOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { localAccountManager, LocalAccountData } from '../utils/localAccount';
import { aptos, FULL_MODULE_ADDRESS } from '../utils/aptosClient';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface LocalAccountManagerProps {
  onAccountReady: (account: any) => void;
}

const LocalAccountManager: React.FC<LocalAccountManagerProps> = ({ onAccountReady }) => {
  const [accountData, setAccountData] = useState<LocalAccountData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState('');
  const [fundingModalVisible, setFundingModalVisible] = useState(false);
  
  const { connected, account: walletAccount, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    // Load existing account or create new one
    const existing = localAccountManager.getAccountData();
    if (existing) {
      setAccountData(existing);
      determineCurrentStep(existing);
      checkBalance();
    } else {
      // Create new account automatically
      const newAccount = localAccountManager.generateNewAccount();
      setAccountData(newAccount);
      setCurrentStep(0);
    }
  }, []);

  useEffect(() => {
    // Notify parent when account is ready for use
    if (accountData?.initialized) {
      const account = localAccountManager.getAccount();
      onAccountReady(account);
    }
  }, [accountData, onAccountReady]);

  const determineCurrentStep = (data: LocalAccountData) => {
    if (data.initialized) {
      setCurrentStep(2);
    } else if (data.funded) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  };

  const checkBalance = async () => {
    try {
      const bal = await localAccountManager.getBalance(aptos);
      setBalance(bal);
      
      // Auto-mark as funded if balance > 0
      if (bal > 0 && accountData && !accountData.funded) {
        localAccountManager.markFunded();
        setAccountData({ ...accountData, funded: true });
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
    }
  };

  const handleFundFromWallet = async () => {
    if (!connected || !walletAccount || !accountData) {
      message.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Send 0.1 APT (100000000 octas) to the local account
      const transaction = {
        function: '0x1::aptos_account::transfer',
        arguments: [accountData.address, '100000000'],
        type: 'entry_function_payload',
      };

      const response = await signAndSubmitTransaction(transaction);
      message.success('Funding transaction submitted!');
      
      // Wait a bit then check balance
      setTimeout(() => {
        checkBalance();
      }, 3000);
      
    } catch (error: any) {
      console.error('Funding failed:', error);
      message.error(`Funding failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeGame = async () => {
    if (!accountData) return;
    
    setLoading(true);
    try {
      const account = localAccountManager.getAccount();
      if (!account) throw new Error('No account available');

      // Submit initialization transaction
      const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${FULL_MODULE_ADDRESS}::initialize_player`,
          functionArguments: [],
        },
      });

      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      console.log(committedTxn);

      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
      
      localAccountManager.markInitialized();
      setAccountData({ ...accountData, initialized: true });
      setCurrentStep(2);
      
      message.success('Game initialized successfully!');
    } catch (error: any) {
      console.error('Initialization failed:', error);
      message.error(`Initialization failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  const handleExport = () => {
    try {
      const exportData = localAccountManager.exportAccount();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookie-clicker-account-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Account exported successfully!');
    } catch (error: any) {
      message.error(`Export failed: ${error.message}`);
    }
  };

  const handleImport = () => {
    try {
      const newAccountData = localAccountManager.importAccount(importData);
      setAccountData(newAccountData);
      determineCurrentStep(newAccountData);
      setImportModalVisible(false);
      setImportData('');
      checkBalance();
      message.success('Account imported successfully!');
    } catch (error: any) {
      message.error(`Import failed: ${error.message}`);
    }
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: 'Delete Local Account',
      content: 'Are you sure you want to delete your local account? This action cannot be undone. Make sure you have exported your account first!',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        localAccountManager.deleteAccount();
        setAccountData(null);
        setCurrentStep(0);
        message.info('Local account deleted');
        // Create new account
        const newAccount = localAccountManager.generateNewAccount();
        setAccountData(newAccount);
      },
    });
  };

  const formatBalance = (balance: number) => {
    return (balance / 100000000).toFixed(4) + ' APT';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!accountData) {
    return <div>Loading...</div>;
  }

  return (
    <Card title="Local Account Manager" className="mb-6">
      <Space direction="vertical" size="large" className="w-full">
        {/* Account Info */}
        <div>
          <Title level={4}>Your Local Account</Title>
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>Address:</Text>
              <Space>
                <Text code>{formatAddress(accountData.address)}</Text>
                <Tooltip title="Copy Address">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyToClipboard(accountData.address, 'Address')}
                  />
                </Tooltip>
              </Space>
            </div>
            
            <div className="flex items-center justify-between">
              <Text strong>Balance:</Text>
              <Text>{formatBalance(balance)}</Text>
            </div>

            <div className="flex items-center justify-between">
              <Text strong>Private Key:</Text>
              <Space>
                <Text code>
                  {showPrivateKey ? accountData.privateKey : '••••••••••••••••'}
                </Text>
                <Tooltip title={showPrivateKey ? "Hide" : "Show"}>
                  <Button 
                    type="text" 
                    icon={showPrivateKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    size="small"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  />
                </Tooltip>
                <Tooltip title="Copy Private Key">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyToClipboard(accountData.privateKey, 'Private Key')}
                  />
                </Tooltip>
              </Space>
            </div>
          </Space>
        </div>

        {/* Setup Steps */}
        <div>
          <Title level={4}>Setup Progress</Title>
          <Steps current={currentStep} direction="vertical">
            <Step
              title="Fund Account"
              description="Send some APT to your local account to cover transaction fees"
              icon={currentStep > 0 ? <CheckCircleOutlined /> : <WalletOutlined />}
            />
            <Step
              title="Initialize Game"
              description="Initialize your cookie clicker game state on the blockchain"
              icon={currentStep > 1 ? <CheckCircleOutlined /> : loading ? <LoadingOutlined /> : undefined}
            />
            <Step
              title="Ready to Play!"
              description="Your account is ready for cookie clicking"
              icon={<CheckCircleOutlined />}
            />
          </Steps>
        </div>

        {/* Action Buttons */}
        <Space wrap>
          {currentStep === 0 && (
            <>
              <Button 
                type="primary" 
                onClick={() => setFundingModalVisible(true)}
                icon={<WalletOutlined />}
              >
                Fund Account
              </Button>
              <Button onClick={() => checkBalance()}>
                Check Balance
              </Button>
            </>
          )}
          
          {currentStep === 1 && (
            <Button 
              type="primary" 
              onClick={handleInitializeGame}
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              Initialize Game
            </Button>
          )}

          <Button 
            onClick={handleExport}
            icon={<ExportOutlined />}
          >
            Export Account
          </Button>
          
          <Button 
            onClick={() => setImportModalVisible(true)}
            icon={<ImportOutlined />}
          >
            Import Account
          </Button>
          
          <Button 
            danger 
            onClick={handleDeleteAccount}
            icon={<DeleteOutlined />}
          >
            Delete Account
          </Button>
        </Space>
      </Space>

      {/* Funding Modal */}
      <Modal
        title="Fund Your Local Account"
        open={fundingModalVisible}
        onCancel={() => setFundingModalVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" size="large" className="w-full">
          <Paragraph>
            Your local account needs some APT to pay for transaction fees. You can fund it in two ways:
          </Paragraph>
          
          {connected && (
            <div>
              <Title level={5}>Option 1: Fund from Connected Wallet</Title>
              <Button 
                type="primary" 
                onClick={handleFundFromWallet}
                loading={loading}
                block
              >
                Send 0.1 APT from Wallet
              </Button>
            </div>
          )}
          
          <div>
            <Title level={5}>Option 2: Manual Transfer</Title>
            <Paragraph>Send APT to this address from any wallet or faucet:</Paragraph>
            
            <div className="text-center mb-4">
              <QRCode value={accountData.address} size={200} />
            </div>
            
            <Input.Group compact>
              <Input 
                value={accountData.address} 
                readOnly 
                style={{ width: 'calc(100% - 32px)' }}
              />
              <Tooltip title="Copy Address">
                <Button 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(accountData.address, 'Address')}
                />
              </Tooltip>
            </Input.Group>
            
            <Paragraph className="mt-2">
              <Text type="secondary">
                Minimum: 0.01 APT for transaction fees
              </Text>
            </Paragraph>
          </div>
        </Space>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Account"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false);
          setImportData('');
        }}
        okText="Import"
      >
        <Space direction="vertical" size="middle" className="w-full">
          <Paragraph>
            Paste your exported account JSON data below:
          </Paragraph>
          <Input.TextArea
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste your account JSON here..."
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default LocalAccountManager;
