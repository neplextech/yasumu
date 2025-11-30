import { DenFactory } from '@yasumu/den';
import { AppModule } from './modules/app.module.ts';

export const rpcServer = await DenFactory.create(AppModule);
