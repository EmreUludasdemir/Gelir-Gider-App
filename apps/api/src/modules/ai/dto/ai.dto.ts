import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value
}

export class ChatRequestDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string
}

export class ParseTransactionDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  input!: string
}

export class CategorizeDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string
}

export class LearnCategoryDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryId!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryLabel!: string
}

export class CategorySuggestionsQueryDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string
}
