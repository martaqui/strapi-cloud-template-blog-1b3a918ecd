"use strict";

/**
 * pedido controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::pedido.pedido", ({ strapi }) => ({
  async create(ctx) {
    // Obtener el usuario autenticado
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("Usuario no autenticado");
    }

    // Asignar el usuario al pedido
    ctx.request.body.data.user = user.id;

    // Llamar al método create original
    const response = await super.create(ctx);

    return response;
  },
}));
