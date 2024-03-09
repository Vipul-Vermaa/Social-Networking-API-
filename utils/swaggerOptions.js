import swaggerJSDoc from "swagger-jsdoc";
import swaggerDefinition from "./swaggerDefinition.js";
const options={
    swaggerDefinition,
    apis:['./routes/*.js'],
}
const swaggerSpec=swaggerJSDoc(options)
export default swaggerSpec