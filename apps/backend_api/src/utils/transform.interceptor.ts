import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map} from 'rxjs';
import type { Response } from 'express';



@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();
    const StatusCode = res.statusCode ?? 200;
    return next.handle().pipe(map((data: T) => ({
      statusCode: StatusCode,
      message: 'Success',
      data,
    })));
  }
}
