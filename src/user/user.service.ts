import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(user: {
    id?: number;
    name?: string;
    email?: string;
  }): Promise<User> {
    return await this.userRepository.findOne({
      where: user,
    });
  }

  async paginate(page: number, search: string) {
    const take = 20;
    const skip = page ? take * (page - 1) : 0;

    const query = {
      where: [],
      take: take,
      skip: skip,
    };
    if (search.length) {
      query.where = [
        { name: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
      ];
    }

    const [result, total] = await this.userRepository.findAndCount({
      select: {
        id: true,
        email: true,
        name: true,
      },
      order: {
        id: 'DESC',
      },
      ...query,
    });

    const lastPage = Math.ceil(total / take);

    return {
      data: result,
      total,
      last_page: lastPage,
    };
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (user) {
      throw new RpcException({
        code: 400,
        message: 'User with this email already exist',
      });
    }

    const password = await bcrypt.hash(createUserDto.password, 5);

    return await this.userRepository.save({
      name: createUserDto.name,
      email: createUserDto.email,
      password,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new RpcException({
        code: 400,
        message: 'User not found',
      });
    }

    const data = {
      name: updateUserDto.name,
      email: updateUserDto.email,
    };

    if (updateUserDto.password) {
      data['password'] = await bcrypt.hash(updateUserDto.password, 5);
    }

    return await this.userRepository.update(id, data);
  }

  async remove(id: number) {
    return await this.userRepository.delete(id);
  }
}
