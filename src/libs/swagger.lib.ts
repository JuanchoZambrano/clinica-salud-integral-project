import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: "Clinica Salud Integral API",
    description: "Documentación automática de la API.",
    version: "1.0.0",
  },
  host: "localhost:3000",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Ingresa tu token JWT con el formato: Bearer {token}",
    },
  },
};

const outputFile = 'swagger-output.json';

const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
    await import('../index.js');
});