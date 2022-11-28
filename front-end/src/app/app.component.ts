import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ethers } from 'ethers';
import tokenJson from '../assets/MyToken.json';
import ballotJson from '../assets/TokenizedBallot.json';
import { claimTokensDTO } from './dto/ClaimTokensDTO';
import { voteBallotDTO } from './dto/VoteBallotDTO';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  wallet: ethers.Wallet | undefined;
  provider: ethers.providers.Provider;

  tokenContract: ethers.Contract | undefined;
  tokenAddress: string | undefined;

  ethBalance: number | string | undefined;
  tokenBalance: number | string | undefined;
  votePower: number | string | undefined;

  ballotContract: ethers.Contract | undefined;
  ballotAddress: string | undefined;

  ballots: voteBallotDTO[];
  ballotPower: string | undefined;

  importWalletDisplay: boolean;
  voteInProgress: boolean;

  constructor(private http: HttpClient) {
    this.provider = ethers.getDefaultProvider("goerli", {alchemy: "<input alchemy key>"});
    this.http.get<any>("http://localhost:3000/token-address").subscribe((ans) => {
      this.tokenAddress = ans.result;
    });

    this.importWalletDisplay = false;
    this.voteInProgress = false;
    this.ballots = [];
  }

  createWallet() {
    this.toggleImport(false);
    this.wallet = ethers.Wallet.createRandom().connect(this.provider);
    this.setTokenContract();
  }

  setTokenContract() {
    if (this.tokenAddress && this.wallet) {
      this.tokenContract = new ethers.Contract(this.tokenAddress, tokenJson.abi, this.wallet);
    }
    this.updateValues();
  }

  updateValues() {
    [this.ethBalance, this.tokenBalance, this.votePower] = ["loading...", "loading...", "loading..."]
    this.wallet?.getBalance().then((balanceBN) => {
      this.ethBalance = parseFloat(ethers.utils.formatEther(balanceBN));
    });
    if (this.tokenContract) {

      this.tokenContract['balanceOf'](
        this.wallet?.address
      ).then((balanceBn: ethers.BigNumberish) => {
        this.tokenBalance = parseFloat(ethers.utils.formatEther(balanceBn));
      })

      this.tokenContract['getVotes'](
        this.wallet?.address
      ).then((balanceBn: ethers.BigNumberish) => {
        this.votePower = parseFloat(ethers.utils.formatEther(balanceBn));
      })
    }
  }

  requestTokens(amount: string) {
    const body = new claimTokensDTO(this.wallet?.address ?? "", amount);
    [this.ethBalance, this.tokenBalance, this.votePower] = ["loading...", "loading...", "loading..."]
    this.http.post<any>("http://localhost:3000/claim-tokens", body).subscribe(async (ans) => {
      const txHash = ans.transactionHash;
      const tx = await this.provider.getTransaction(txHash);
      tx.wait();
      this.updateValues();
    });
  }

  selfDelegate(account: string) {
    this.http.post<any>("http://localhost:3000/delegate", {account: account}).subscribe(async (ans) => {
      const txHash = ans.transactionHash;
      const tx = await this.provider.getTransaction(txHash);
      tx.wait();
      this.updateBallotValues();
    });
  }

  vote(option: string, amount: string) {
    this.voteInProgress = true;
    this.ballotPower = "loading...";
    this.http.post<any>("http://localhost:3000/vote", {proposal: option, amount: amount}).subscribe(async (ans) => {
      const txHash = ans.transactionHash;
      const tx = await this.provider.getTransaction(txHash);
      tx.wait();
      this.updateBallotValues();
      this.voteInProgress = false;
    });
  }

  connectBallot(ballotAddress: string) {
    this.ballotAddress = ballotAddress;
    if (this.ballotAddress && this.wallet) {
      this.ballotContract = new ethers.Contract(this.ballotAddress, ballotJson.abi, this.wallet);
    }
    this.updateBallotValues();
  }

  updateBallotValues() {
    if (this.ballotContract) {
      this.ballots = [];
      let i : number;
      for (i = 0; i < 3; i++) {
        this.ballotContract['proposals'](i)
          .then((arrayObj: any) => {
            const dto = new voteBallotDTO(ethers.utils.parseBytes32String(arrayObj.name), ethers.utils.formatEther(arrayObj.voteCount));
            this.ballots.push(dto);
          })
      }
      this.ballotContract['votePower'](this.wallet?.address ?? "")
        .then((votingPower: ethers.BigNumberish) => {
          this.ballotPower = ethers.utils.formatEther(votingPower);
        })
    }
  }

  importWallet(privateKey: string) {
    this.importWalletDisplay = false;
    this.wallet = new ethers.Wallet(privateKey).connect(this.provider);
    this.setTokenContract();
  }

  toggleImport(show: boolean) {
    this.importWalletDisplay = show;
  }
}
