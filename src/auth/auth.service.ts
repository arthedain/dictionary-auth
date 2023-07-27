import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegistrationDto } from './dto/registration.dto';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RpcException } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registrationDto: RegistrationDto) {
    const user = await this.userService.findOne({
      email: registrationDto.email,
    });

    if (user) {
      throw new RpcException({
        code: 400,
        message: 'User with this email already exist',
      });
    }

    const password = await bcrypt.hash(registrationDto.password, 5);

    const data = await this.userRepository.save({
      name: registrationDto.name,
      email: registrationDto.email,
      password,
    });

    const payload = { id: data.id, name: data.name, email: data.email };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '30d',
      }),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findOne({
      email: loginDto.email,
    });

    if (!user) {
      throw new RpcException({
        code: 403,
        message: 'Invalid credentials',
      });
    }

    const result = await bcrypt.compare(loginDto.password, user.password);

    if (!result) {
      throw new RpcException({
        code: 403,
        message: 'Invalid credentials',
      });
    }

    const payload = { id: user.id, name: user.name, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '30d',
      }),
    };
  }

  async check(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.findOne({
        id: payload.id,
        name: payload.name,
        email: payload.email,
      });

      return !!user;
    } catch (error) {
      return false;
    }
  }

  async getUser(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      return {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      };
    } catch (error) {
      return false;
    }
  }
}
