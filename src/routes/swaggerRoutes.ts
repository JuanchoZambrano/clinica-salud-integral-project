import swaggerUi from 'swagger-ui-express'; 
import { Router, type Request, type Response } from 'express';
import swaggerDoc from '../../swagger-output.json' with {type: 'json'}

export const swaggerRouter: Router = Router();

swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

export default swaggerRouter;