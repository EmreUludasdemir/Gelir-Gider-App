import { IsEmail, IsNotEmpty, MinLength, IsOptional, Matches, IsString, MaxLength } from 'class-validator'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

export class LoginDto {
    @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz' })
    email!: string

    @IsNotEmpty({ message: 'Sifre zorunludur' })
    password!: string

    @IsOptional()
    @IsString()
    twoFactorCode?: string
}

export class RegisterDto {
    @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz' })
    email!: string

    @IsNotEmpty({ message: 'Sifre zorunludur' })
    @MinLength(8, { message: 'Sifre en az 8 karakter olmalidir' })
    @Matches(PASSWORD_REGEX, {
        message: 'Sifre en az 1 buyuk harf, 1 kucuk harf, 1 rakam ve 1 ozel karakter icermelidir'
    })
    password!: string

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string
}

export class RefreshTokenDto {
    @IsOptional()
    @IsString()
    refreshToken?: string
}

export class ChangePasswordDto {
    @IsNotEmpty({ message: 'Eski sifre zorunludur' })
    oldPassword!: string

    @IsNotEmpty({ message: 'Yeni sifre zorunludur' })
    @MinLength(8, { message: 'Sifre en az 8 karakter olmalidir' })
    @Matches(PASSWORD_REGEX, {
        message: 'Sifre en az 1 buyuk harf, 1 kucuk harf, 1 rakam ve 1 ozel karakter icermelidir'
    })
    newPassword!: string
}

export class RequestPasswordResetDto {
    @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz' })
    email!: string
}

export class ConfirmPasswordResetDto {
    @IsNotEmpty({ message: 'Token zorunludur' })
    @IsString()
    token!: string

    @IsNotEmpty({ message: 'Yeni sifre zorunludur' })
    @MinLength(8, { message: 'Sifre en az 8 karakter olmalidir' })
    @Matches(PASSWORD_REGEX, {
        message: 'Sifre en az 1 buyuk harf, 1 kucuk harf, 1 rakam ve 1 ozel karakter icermelidir'
    })
    newPassword!: string
}

export class RequestEmailVerificationDto {
    @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz' })
    email!: string
}

export class ConfirmEmailVerificationDto {
    @IsNotEmpty({ message: 'Token zorunludur' })
    @IsString()
    token!: string
}

export class Enable2FADto {
    @IsNotEmpty({ message: '2FA kodu zorunludur' })
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code!: string

    @IsNotEmpty({ message: 'Secret zorunludur' })
    @IsString()
    secret!: string
}
