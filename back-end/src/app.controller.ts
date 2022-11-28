import { Body, Post } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { claimTokensDTO } from './dto/ClaimTokensDTO';
import { voteBallotDTO } from './dto/VoteBallotDTO';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("token-address")
  getTokenAddress() {
    return this.appService.getTokenAddress();
  }

  @Post("claim-tokens")
  claimTokens(@Body() body: claimTokensDTO) {
    return this.appService.claimTokens(body.address, body.amount);
  }

  @Post("vote")
  vote(@Body() body: voteBallotDTO) {
    return this.appService.vote(body.proposal, body.amount);
  }

  @Post("delegate")
  delegate(@Body() body: { account: string }) {
    return this.appService.delegate(body.account);
  }
}
