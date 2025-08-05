"use strict";

module.exports = (plugin) => {
  const sanitizeOutput = (user) => {
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  };

  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }
    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      { populate: ["datosFacturacion"] }
    );

    ctx.body = sanitizeOutput(user);
  };

  // Agregar método para actualizar datos de facturación
  plugin.controllers.user.updateProfile = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    try {
      const updatedUser = await strapi.entityService.update(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          data: ctx.request.body,
          populate: ["datosFacturacion"],
        }
      );

      ctx.body = sanitizeOutput(updatedUser);
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  };

  // Agregar ruta personalizada
  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/user/profile",
    handler: "user.updateProfile",
  });

  // Guardar el método register original
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    // Asegurar que username existe
    if (!ctx.request.body.username) {
      ctx.request.body.username = ctx.request.body.email.split("@")[0];
    }

    // Llamar al método original
    return await originalRegister(ctx);
  };

  return plugin;
};
