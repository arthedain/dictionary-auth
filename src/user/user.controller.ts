import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('all')
  public async all(
    @Payload('page') page: number,
    @Payload('search') search: string,
  ) {
    return this.userService.paginate(page, search);
  }

  @EventPattern('create')
  async create(@Payload() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
  }
  @EventPattern('update')
  async update(
    @Payload('id') id: number,
    @Payload() updateUserDto: UpdateUserDto,
  ) {
    await this.userService.update(id, updateUserDto);
  }

  @EventPattern('delete')
  async delete(@Payload('id') id: number) {
    await this.userService.remove(id);
  }
}
