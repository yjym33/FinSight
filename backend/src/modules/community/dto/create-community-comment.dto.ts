import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommunityCommentDto {
  @ApiProperty({ example: '동감합니다!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'uuid-of-post' })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({ example: 'uuid-of-parent-comment', required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
