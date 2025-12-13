import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    password!: string;
}

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @IsOptional()
    name?: string;
}
