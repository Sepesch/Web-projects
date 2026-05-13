import { IsString, IsNumber, Min } from 'class-validator';

export class CreateBrokerDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  balance: number;
}