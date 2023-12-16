import { NextFunction, Request, Response, RequestHandler } from 'express';

const dynamicMiddleware = (middlewares: RequestHandler[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0;

    const processNextMiddleware = () => {
      if (index >= middlewares.length) {
        next();
        return;
      }

      try {
        middlewares[index](req, res, (err: unknown) => {
          if (err) {
            next(err);
            return;
          }

          index++;
          processNextMiddleware();
        });
      } catch (err) {
        next(err);
      }
    };

    processNextMiddleware();
  };
};

export default dynamicMiddleware;
