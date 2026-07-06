import { ethers } from 'ethers';

export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111

export const web3Service = {
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  },

  async getConnectedAccounts(): Promise<string[]> {
    if (!this.isMetaMaskInstalled()) return [];
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner().catch(() => null);
      if (!signer) return [];
      const address = await signer.getAddress();
      return [address];
    } catch (err) {
      console.error('Error getting connected accounts:', err);
      return [];
    }
  },

  async getChainId(): Promise<string | null> {
    if (!this.isMetaMaskInstalled()) return null;
    try {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      return chainId;
    } catch (err) {
      console.error('Error getting chain ID:', err);
      return null;
    }
  },

  async connect(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('Chưa cài đặt MetaMask. Vui lòng cài đặt tiện ích mở rộng MetaMask để tiếp tục.');
    }
    
    // Request accounts
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('Người dùng từ chối kết nối ví.');
    }
    
    return accounts[0];
  },

  async switchToSepolia(): Promise<boolean> {
    if (!this.isMetaMaskInstalled()) return false;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia chain:', addError);
          throw new Error('Không thể thêm mạng Sepolia vào MetaMask.');
        }
      }
      console.error('Error switching to Sepolia:', switchError);
      throw new Error('Không thể chuyển sang mạng Sepolia. Vui lòng xác nhận chuyển mạng trong MetaMask.');
    }
  },

  truncateAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
};
