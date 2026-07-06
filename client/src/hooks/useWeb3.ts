import { useState, useEffect, useCallback } from 'react';
import { web3Service, SEPOLIA_CHAIN_ID_HEX } from '../services/web3Service';
import type { Web3State } from '../types/web3';

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    isInstalled: web3Service.isMetaMaskInstalled(),
    isConnected: false,
    walletAddress: null,
    chainId: null,
    isSepolia: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (!web3Service.isMetaMaskInstalled()) {
      setState(prev => ({ ...prev, isInstalled: false }));
      return;
    }

    const accounts = await web3Service.getConnectedAccounts();
    const chainId = await web3Service.getChainId();

    const isConnected = accounts.length > 0;
    const walletAddress = isConnected ? accounts[0] : null;
    const isSepolia = chainId === SEPOLIA_CHAIN_ID_HEX;

    setState({
      isInstalled: true,
      isConnected,
      walletAddress,
      chainId,
      isSepolia,
      error: null,
    });
  }, []);

  // Listen to changes in MetaMask
  useEffect(() => {
    if (!web3Service.isMetaMaskInstalled()) return;

    checkConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      const isConnected = accounts.length > 0;
      const walletAddress = isConnected ? accounts[0] : null;
      setState(prev => ({
        ...prev,
        isConnected,
        walletAddress,
        error: null,
      }));
    };

    const handleChainChanged = (chainId: string) => {
      setState(prev => ({
        ...prev,
        chainId,
        isSepolia: chainId === SEPOLIA_CHAIN_ID_HEX,
        error: null,
      }));
    };

    const ethereum = (window as any).ethereum;
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection]);

  const connect = async () => {
    setState(prev => ({ ...prev, error: null }));
    try {
      // Connect first
      const account = await web3Service.connect();
      const chainId = await web3Service.getChainId();
      const isSepolia = chainId === SEPOLIA_CHAIN_ID_HEX;

      setState(prev => ({
        ...prev,
        isConnected: true,
        walletAddress: account,
        chainId,
        isSepolia,
        error: null,
      }));

      return { success: true, address: account, isSepolia };
    } catch (err: any) {
      const errMsg = err.message || 'Kết nối ví thất bại.';
      setState(prev => ({ ...prev, error: errMsg }));
      return { success: false, error: errMsg };
    }
  };

  const switchToSepolia = async () => {
    setState(prev => ({ ...prev, error: null }));
    try {
      const success = await web3Service.switchToSepolia();
      if (success) {
        setState(prev => ({
          ...prev,
          chainId: SEPOLIA_CHAIN_ID_HEX,
          isSepolia: true,
          error: null,
        }));
      }
      return success;
    } catch (err: any) {
      const errMsg = err.message || 'Chuyển mạng thất bại.';
      setState(prev => ({ ...prev, error: errMsg }));
      return false;
    }
  };

  return {
    ...state,
    connect,
    switchToSepolia,
    checkConnection,
  };
}
