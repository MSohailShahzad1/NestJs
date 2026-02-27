import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.issueToken(user.id, user.email, user.role);

    return {
      ...tokens,
      user: this.usersService.sanitize(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueToken(user.id, user.email, user.role);

    return {
      ...tokens,
      user: this.usersService.sanitize(user),
    };
  }

  profile(userId: number) {
    return this.usersService.findById(userId).then((user) => {
      return this.usersService.sanitize(user);
    });
  }

  private async issueToken(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
}
