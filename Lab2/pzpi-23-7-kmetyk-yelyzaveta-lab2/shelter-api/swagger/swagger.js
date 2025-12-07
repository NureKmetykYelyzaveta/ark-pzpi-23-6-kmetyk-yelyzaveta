const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pet Shelter API",
      version: "1.0.0",
      description: "API документація для системи притулку тварин",
    },
  },
  apis: [
    "./routes/*.js"  // підтягуємо ВСІ контролери
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
