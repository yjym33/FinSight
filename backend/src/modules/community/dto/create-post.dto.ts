import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: '오늘의 시장 전망' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '오늘은 삼성전자가 많이 오를 것 같네요.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '005930', required: false })
  @IsString()
  @IsOptional()
  stockCode?: string;
}
