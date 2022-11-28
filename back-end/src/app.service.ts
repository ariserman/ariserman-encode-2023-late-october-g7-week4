import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as tokenJson from './assets/MyToken.json';
import * as voteJson from './assets/TokenizedBallot.json';

export class PaymentOrdersModel {
  id: number;
  value: number;
  secret: string;
}

@Injectable()
export class AppService {

  provider: ethers.providers.BaseProvider;

  tokenContractAddress: string | undefined;
  tokenContract: ethers.Contract | undefined;

  ballotContractAddress: string | undefined;
  ballotContract: ethers.Contract | undefined;

  constructor(private configService: ConfigService) {
    this.provider = ethers.getDefaultProvider("goerli", {alchemy: this.configService.get('ALCHEMY_KEY') ?? ""});
    this.tokenContractAddress = this.configService.get('TOKEN_ADDRESS');
    
    const wallet = new ethers.Wallet(this.configService.get('PRIVATE_KEY') ?? "");
    // const wallet = ethers.Wallet.fromMnemonic(this.configService.get('MNEMONIC') ?? "");
    const signer = wallet.connect(this.provider);
    this.tokenContract = new ethers.Contract(this.tokenContractAddress, tokenJson.abi, signer);

    this.ballotContractAddress = this.configService.get('BALLOT_ADDRESS');
    this.ballotContract = new ethers.Contract(this.ballotContractAddress, voteJson.abi, signer);
  }

  getTokenAddress() {
    return { result: this.tokenContractAddress };
  }

  async claimTokens(address: string, amount: string) {
    if (this.tokenContract) {
      const tx = await this.tokenContract['mint'](
        address, ethers.utils.parseEther(amount)
      );
      return tx.wait();
    }
  }

  async vote(proposal: string, amount: string) {
    if (this.ballotContract) {
      const tx = await this.ballotContract['vote'](
        (+proposal)-1, ethers.utils.parseEther(amount)
      );
      return tx.wait();
    }
  }

  async delegate(account: string) {
    if (this.tokenContract) {
      const tx = await this.tokenContract['delegate'](
        account
      );
      return tx.wait();
    }
  }
}
