import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Stock code', example: '005930' })
  @IsString()
  @IsNotEmpty()
  stockCode: string;

  @ApiProperty({ description: 'Comment content', example: '삼전 가즈아!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '댓글이 너무 짧습니다. (최소 2자)' })
  @MaxLength(200, { message: '댓글이 너무 깁니다. (최대 200자)' })
  content: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}
