import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { productController } from "./product.controller";
import {
    createProductSchema,
    deleteProductSchema,
    getProductSchema,
    listProductsSchema,
    updateProductSchema,
} from "./product.schema";

export const productRoutes = Router();

productRoutes.get("/", validate(listProductsSchema), productController.list);
productRoutes.get("/:id", validate(getProductSchema), productController.get);
productRoutes.post("/", validate(createProductSchema), productController.create);
productRoutes.patch("/:id", validate(updateProductSchema), productController.update);
productRoutes.delete("/:id", validate(deleteProductSchema), productController.delete);
