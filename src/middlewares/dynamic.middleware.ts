import { NextFunction, Request, Response, RequestHandler } from "express";

const dynamicMiddleware = (middlewares: RequestHandler[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0;

    const processNextMiddleware = () => {
      if (index < middlewares.length) {
        try {
          middlewares[index](req, res, (err: unknown) => {
            if (err) {
              next(err);
            } else {
              index++;
              processNextMiddleware();
            }
          });
        } catch (err) {
          next(err);
        }
      } else {
        next();
      }
    };

    processNextMiddleware();
  };
};

export default dynamicMiddleware;
