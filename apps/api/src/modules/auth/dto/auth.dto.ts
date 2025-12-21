import { IsEmail, IsNotEmpty, MinLength, IsOptional, Matches, IsString, MaxLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
    email!: string;

    @IsNotEmpty({ message: 'Şifre zorunludur' })
    password!: string;

    @IsOptional()
    @IsString()
    twoFactorCode?: string;
}

export class RegisterDto {
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
    email!: string;

    @IsNotEmpty({ message: 'Şifre zorunludur' })
    @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Şifre en az 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir'
    })
    password!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;
}

export class RefreshTokenDto {
    @IsNotEmpty({ message: 'Refresh token zorunludur' })
    refreshToken!: string;
}

export class ChangePasswordDto {
    @IsNotEmpty({ message: 'Eski şifre zorunludur' })
    oldPassword!: string;

    @IsNotEmpty({ message: 'Yeni şifre zorunludur' })
    @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Şifre en az 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir'
    })
    newPassword!: string;
}

export class Enable2FADto {
    @IsNotEmpty({ message: '2FA kodu zorunludur' })
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code!: string;

    @IsNotEmpty({ message: 'Secret zorunludur' })
    @IsString()
    secret!: string;
}
