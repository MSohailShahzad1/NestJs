import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'sqlite',
  database: configService.get<string>('DB_NAME') ?? 'dev.sqlite',
  autoLoadEntities: true,
  synchronize: true,
});
