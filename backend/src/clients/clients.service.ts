import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateClientInput {
  kind?: string;
  fullNameAr: string;
  fullNameFr?: string;
  phone?: string;
  email?: string;
  address?: string;
  cin?: string;
  ice?: string;
  notes?: string;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientInput) {
    return this.prisma.client.create({
      data: {
        kind: dto.kind ?? 'PERSON',
        fullNameAr: dto.fullNameAr,
        fullNameFr: dto.fullNameFr,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        cin: dto.cin,
        ice: dto.ice,
        notes: dto.notes,
      },
    });
  }

  async list() {
    return this.prisma.client.findMany({
      orderBy: { fullNameAr: 'asc' },
      include: { _count: { select: { cases: true } } },
    });
  }

  async findOne(id: number) {
    const c = await this.prisma.client.findUnique({
      where: { id },
      include: { cases: { include: { court: true } } },
    });
    if (!c) throw new NotFoundException('الزبون غير موجود');
    return c;
  }
}