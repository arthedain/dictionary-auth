import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationDto } from './dto/registration.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('registration')
  async registration(@Payload() registrationDto: RegistrationDto) {
    return await this.authService.register(registrationDto);
  }

  @MessagePattern('login')
  async login(@Payload() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @MessagePattern('check')
  async check(@Payload() token: string) {
    return await this.authService.check(token);
  }

  @MessagePattern('get-user')
  async getUser(@Payload() token: string) {
    return await this.authService.getUser(token);
  }
}
